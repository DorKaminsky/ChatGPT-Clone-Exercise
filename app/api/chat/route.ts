import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { LLMService } from '@/lib/llm-service';
import { chartSpecGenerator } from '@/lib/chart-spec-generator';
import type { ChatRequest, ChatResponse, ChartData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { query, dataSourceId } = body;

    // Validate request
    if (!query || !dataSourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: query and dataSourceId' },
        { status: 400 }
      );
    }

    // Step 1: Retrieve data source
    const parsedData = dataService.getData(dataSourceId);
    if (!parsedData) {
      return NextResponse.json(
        { error: 'Data source not found. Please upload a file first.' },
        { status: 404 }
      );
    }

    // Step 2: Initialize LLM service
    const llmService = new LLMService();

    // Step 3: Phase 1 - Analyze query to understand intent
    console.log('Analyzing query:', query);
    const analysis = await llmService.analyzeQuery(
      query,
      parsedData.schema,
      parsedData.preview
    );
    console.log('Query analysis:', analysis);

    // Step 4: Filter and process data based on analysis
    let processedData = parsedData.data;

    // Apply column filtering if specified
    if (analysis.dataNeeded.columns && analysis.dataNeeded.columns.length > 0) {
      const columnsSet = new Set(analysis.dataNeeded.columns);
      processedData = processedData.map(row => {
        const filteredRow: any = {};
        Object.keys(row).forEach(key => {
          if (columnsSet.has(key)) {
            filteredRow[key] = row[key];
          }
        });
        return filteredRow;
      });
    }

    // Apply basic filtering if specified
    if (analysis.dataNeeded.filters) {
      // Simple filter implementation
      // This could be enhanced based on the filter structure
      processedData = processedData.filter(row => {
        // Add custom filter logic here based on analysis.dataNeeded.filters
        return true; // For now, include all
      });
    }

    // Apply aggregation if needed
    if (analysis.aggregation && analysis.aggregation !== 'none') {
      processedData = applyAggregation(processedData, analysis);
    }

    // Limit data size for LLM (send max 100 rows)
    const dataForLLM = processedData.slice(0, 100);

    console.log('Processed data size:', dataForLLM.length);

    // Step 5: Phase 2 - Generate response with visualization
    const aiResponse = await llmService.generateResponse(
      query,
      dataForLLM,
      parsedData.schema
    );
    console.log('AI response:', aiResponse);

    // Step 6: Generate chart specification if visualization is needed
    let visualization: ChartData | undefined;
    if (aiResponse.visualization) {
      try {
        visualization = chartSpecGenerator.generateSpec(
          aiResponse.visualization.type,
          dataForLLM,
          aiResponse.visualization.dataMapping
        );
        console.log('Generated chart spec:', visualization);
      } catch (error) {
        console.error('Error generating chart:', error);
        // Don't fail the whole request if chart generation fails
      }
    }

    // Step 7: Return response
    const response: ChatResponse = {
      textResponse: aiResponse.answer,
      visualization,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Chat API error:', error);

    // Handle specific error types
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'LLM service configuration error. Please check API key.' },
        { status: 500 }
      );
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'An error occurred processing your query' },
      { status: 500 }
    );
  }
}

// Helper function to apply aggregation
function applyAggregation(data: any[], analysis: any): any[] {
  const { aggregation, dataNeeded } = analysis;

  if (aggregation === 'groupby' && dataNeeded.columns?.length >= 2) {
    // Group by first column, aggregate second column
    const groupByCol = dataNeeded.columns[0];
    const valueCol = dataNeeded.columns[1];

    const grouped: { [key: string]: number } = {};

    data.forEach(row => {
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

  if (aggregation === 'sum' && dataNeeded.columns?.length >= 2) {
    const groupByCol = dataNeeded.columns[0];
    const valueCol = dataNeeded.columns[1];

    const grouped: { [key: string]: number } = {};

    data.forEach(row => {
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

  if (aggregation === 'average' && dataNeeded.columns?.length >= 2) {
    const groupByCol = dataNeeded.columns[0];
    const valueCol = dataNeeded.columns[1];

    const grouped: { [key: string]: { sum: number; count: number } } = {};

    data.forEach(row => {
      const key = row[groupByCol];
      const value = parseFloat(row[valueCol]) || 0;

      if (grouped[key] === undefined) {
        grouped[key] = { sum: 0, count: 0 };
      }
      grouped[key].sum += value;
      grouped[key].count += 1;
    });

    return Object.entries(grouped).map(([key, stats]) => ({
      [groupByCol]: key,
      [valueCol]: stats.sum / stats.count,
    }));
  }

  if (aggregation === 'count' && dataNeeded.columns?.length >= 1) {
    const groupByCol = dataNeeded.columns[0];

    const grouped: { [key: string]: number } = {};

    data.forEach(row => {
      const key = row[groupByCol];

      if (grouped[key] === undefined) {
        grouped[key] = 0;
      }
      grouped[key] += 1;
    });

    return Object.entries(grouped).map(([key, count]) => ({
      [groupByCol]: key,
      count: count,
    }));
  }

  // No aggregation or unknown type
  return data;
}
