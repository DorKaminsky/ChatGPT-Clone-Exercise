import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { dataService } from '@/lib/data-service';
import { LLMService } from '@/lib/llm-service';
import { chartSpecGenerator } from '@/lib/chart-spec-generator';
import type { ChatRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body: ChatRequest = await request.json();
    const { query, dataSourceId, model } = body;

    // Validate request
    if (!query || !dataSourceId) {
      return new Response(
        encoder.encode(
          JSON.stringify({ type: 'error', message: 'Missing required fields' })
        ),
        { status: 400 }
      );
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Retrieve data source
          const parsedData = dataService.getData(dataSourceId);
          if (!parsedData) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: 'Data source not found' })}\n\n`
              )
            );
            controller.close();
            return;
          }

          // Step 2: Send status update - analyzing
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'status', message: 'Analyzing your question...' })}\n\n`
            )
          );

          // Initialize LLM service
          const llmService = new LLMService(undefined, model);

          // Step 3: Analyze query
          const analysis = await llmService.analyzeQuery(
            query,
            parsedData.schema,
            parsedData.preview
          );

          // Step 4: Process data based on analysis
          let processedData = parsedData.data;

          if (analysis.dataNeeded.columns && analysis.dataNeeded.columns.length > 0) {
            const columnsSet = new Set(analysis.dataNeeded.columns);
            processedData = processedData.map((row) => {
              const filteredRow: any = {};
              Object.keys(row).forEach((key) => {
                if (columnsSet.has(key)) {
                  filteredRow[key] = row[key];
                }
              });
              return filteredRow;
            });
          }

          // Apply aggregation if needed
          if (analysis.aggregation && analysis.aggregation !== 'none') {
            processedData = applyAggregation(processedData, analysis);
          }

          const dataForLLM = processedData.slice(0, 100);

          // Step 5: Send status update - generating
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'status', message: 'Generating response...' })}\n\n`
            )
          );

          // Step 6: Stream the response using Anthropic streaming
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          });

          const prompt = buildResponsePrompt(query, dataForLLM, parsedData.schema);

          // Use the model from LLMService or default
          const selectedModel = llmService.getModel();

          const stream = await anthropic.messages.stream({
            model: selectedModel,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
          });

          let fullResponse = '';

          // First, collect the full response
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullResponse += chunk.delta.text;
            }
          }

          // Step 7: Parse the complete response to extract JSON
          const aiResponse = parseAIResponse(fullResponse);

          // Step 8: Stream only the user-facing text (not the JSON)
          const textToStream = aiResponse.answer;

          // Stream the text in small chunks for smooth appearance
          const chunkSize = 3; // Stream 3 characters at a time
          for (let i = 0; i < textToStream.length; i += chunkSize) {
            const chunk = textToStream.slice(i, i + chunkSize);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`
              )
            );
            // Small delay for smoother streaming effect
            await new Promise(resolve => setTimeout(resolve, 20));
          }

          // Step 9: Generate chart if needed
          if (aiResponse.visualization) {
            try {
              const visualization = chartSpecGenerator.generateSpec(
                aiResponse.visualization.type,
                dataForLLM,
                aiResponse.visualization.dataMapping
              );

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'visualization', data: visualization })}\n\n`
                )
              );
            } catch (error) {
              console.error('Error generating chart:', error);
            }
          }

          // Step 10: Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );

          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: error.message || 'An error occurred' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat stream API error:', error);
    return new Response(
      encoder.encode(
        JSON.stringify({ type: 'error', message: error.message || 'Failed to process request' })
      ),
      { status: 500 }
    );
  }
}

// Helper function to build response prompt
function buildResponsePrompt(query: string, data: any[], schema: any): string {
  return `You are a data analysis assistant. Answer the user's question about their data.

User Question: ${query}

Data Schema:
${schema.columns.map((c: any) => `- ${c.name} (${c.type})`).join('\n')}

Sample Data (first ${data.length} rows):
${JSON.stringify(data, null, 2)}

Instructions:
1. Provide a clear, concise answer to the question
2. Include specific numbers and insights from the data
3. If a visualization would help, suggest the appropriate chart type
4. End your response with a JSON block for visualization if needed:

{
  "answer": "Your text response here",
  "visualization": {
    "type": "bar|pie|line|scatter|table",
    "reason": "Why this chart type",
    "dataMapping": {
      "xAxis": "column_name",
      "yAxis": "column_name",
      "nameField": "column_name",
      "valueField": "column_name"
    }
  }
}`;
}

// Helper function to parse AI response
function parseAIResponse(response: string): any {
  try {
    // Look for JSON code block (```json ... ```)
    const jsonCodeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlockMatch) {
      const jsonStr = jsonCodeBlockMatch[1];
      const parsed = JSON.parse(jsonStr);

      // Extract the text before the JSON block
      const textBeforeJson = response.substring(0, jsonCodeBlockMatch.index).trim();

      return {
        answer: textBeforeJson || parsed.answer || response,
        visualization: parsed.visualization,
      };
    }

    // Fallback: Try to extract plain JSON
    const jsonMatch = response.match(/\{[\s\S]*"visualization"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Extract text before JSON
      const textBeforeJson = response.substring(0, jsonMatch.index).trim();

      return {
        answer: textBeforeJson || parsed.answer || response,
        visualization: parsed.visualization,
      };
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
  }

  // If no JSON found or parsing fails, return full response as text
  return {
    answer: response,
    visualization: undefined,
  };
}

// Helper function to apply aggregation
function applyAggregation(data: any[], analysis: any): any[] {
  const { aggregation, dataNeeded } = analysis;

  if (aggregation === 'groupby' && dataNeeded.columns?.length >= 2) {
    const groupByCol = dataNeeded.columns[0];
    const valueCol = dataNeeded.columns[1];
    const grouped: { [key: string]: number } = {};

    data.forEach((row) => {
      const key = row[groupByCol];
      const value = parseFloat(row[valueCol]) || 0;
      if (grouped[key] === undefined) {
        grouped[key] = 0;
      }
      grouped[key] += value;
    });

    return Object.entries(grouped).map(([key, value]) => ({
      [groupByCol]: key,
      [valueCol]: value,
    }));
  }

  return data;
}
