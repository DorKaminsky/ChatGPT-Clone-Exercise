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
    const { query, dataSourceId, conversationHistory, model } = body;

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
            parsedData.preview,
            conversationHistory
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

          // Step 6: Stream the response using new plain text approach
          for await (const chunk of llmService.generateResponseStream(
            query,
            dataForLLM,
            parsedData.schema,
            conversationHistory
          )) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`
              )
            );
          }

          // Step 7: Generate visualization based on analysis (not LLM)
          if (analysis.needsVisualization && dataForLLM.length > 0) {
            try {
              // Determine chart type based on aggregation and data
              let chartType: 'bar' | 'pie' | 'line' | 'scatter' | 'table' = 'bar';

              if (analysis.aggregation === 'groupby' || analysis.aggregation === 'sum') {
                chartType = 'bar';
              } else if (analysis.aggregation === 'count') {
                chartType = 'bar';
              } else if (analysis.aggregation === 'none' && dataForLLM.length > 5) {
                chartType = 'table';
              }

              // Check if it's time-series data
              const hasDateColumn = analysis.dataNeeded.columns.some(col => {
                const columnDef = parsedData.schema.columns.find((c: any) => c.name === col);
                return columnDef?.type === 'date';
              });
              if (hasDateColumn && chartType === 'bar') {
                chartType = 'line';
              }

              // Get appropriate column mapping
              const columns = analysis.dataNeeded.columns;
              const dataMapping = {
                xAxis: columns[0] || 'name',
                yAxis: columns[1] || 'value',
                nameField: columns[0] || 'name',
                valueField: columns[1] || 'value',
              };

              const visualization = chartSpecGenerator.generateSpec(
                chartType,
                dataForLLM,
                dataMapping
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
