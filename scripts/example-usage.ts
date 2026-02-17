#!/usr/bin/env node

/**
 * Example usage of LLM Service
 * Demonstrates basic integration patterns
 */

import { LLMService } from '../lib/llm-service.js';
import type { DataSchema } from '../lib/types.js';

// Sample data schema matching the Excel file structure
const salesSchema: DataSchema = {
  columns: [
    {
      name: 'Date',
      type: 'date',
      sample: ['2024-01-01', '2024-01-02', '2024-01-03'],
    },
    {
      name: 'Region',
      type: 'string',
      sample: ['North', 'South', 'East', 'West'],
    },
    {
      name: 'Product',
      type: 'string',
      sample: ['Widget A', 'Widget B', 'Widget C'],
    },
    {
      name: 'Quantity',
      type: 'number',
      sample: [10, 25, 15],
    },
    {
      name: 'Price',
      type: 'number',
      sample: [100, 150, 200],
    },
    {
      name: 'Revenue',
      type: 'number',
      sample: [1000, 3750, 3000],
    },
  ],
  rowCount: 100,
};

// Sample preview data
const salesPreview = [
  { Date: '2024-01-01', Region: 'North', Product: 'Widget A', Quantity: 10, Price: 100, Revenue: 1000 },
  { Date: '2024-01-02', Region: 'South', Product: 'Widget B', Quantity: 25, Price: 150, Revenue: 3750 },
  { Date: '2024-01-03', Region: 'East', Product: 'Widget C', Quantity: 15, Price: 200, Revenue: 3000 },
  { Date: '2024-01-04', Region: 'West', Product: 'Widget A', Quantity: 20, Price: 100, Revenue: 2000 },
  { Date: '2024-01-05', Region: 'North', Product: 'Widget B', Quantity: 30, Price: 150, Revenue: 4500 },
];

// Simulated aggregated data that would come from a data service
const productRevenueData = [
  { Product: 'Widget A', TotalRevenue: 35000, Units: 350 },
  { Product: 'Widget B', TotalRevenue: 67500, Units: 450 },
  { Product: 'Widget C', TotalRevenue: 56000, Units: 280 },
];

async function example1_SimpleQuery() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 1: Simple Comparison Query');
  console.log('='.repeat(60));

  const llmService = new LLMService();
  const query = 'Which product generated the most revenue?';

  console.log(`\nUser Query: "${query}"\n`);

  try {
    // Phase 1: Analyze the query
    console.log('Phase 1: Analyzing query...');
    const analysis = await llmService.analyzeQuery(query, salesSchema, salesPreview);
    console.log('\nAnalysis Result:');
    console.log(JSON.stringify(analysis, null, 2));

    // Phase 2: Generate response (using pre-aggregated data)
    console.log('\n\nPhase 2: Generating response...');
    const response = await llmService.generateResponse(query, productRevenueData, salesSchema);
    console.log('\nResponse Result:');
    console.log(JSON.stringify(response, null, 2));

    console.log('\n\nFinal Answer to User:');
    console.log(response.answer);

    if (response.visualization) {
      console.log(`\nVisualization: ${response.visualization.type.toUpperCase()} chart`);
      console.log(`Reason: ${response.visualization.reason}`);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function example2_TrendQuery() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 2: Trend Analysis Query');
  console.log('='.repeat(60));

  const llmService = new LLMService();
  const query = 'Show me the revenue trend over time';

  const trendData = [
    { Month: '2024-01', Revenue: 25000 },
    { Month: '2024-02', Revenue: 32000 },
    { Month: '2024-03', Revenue: 28000 },
    { Month: '2024-04', Revenue: 38000 },
    { Month: '2024-05', Revenue: 42000 },
  ];

  console.log(`\nUser Query: "${query}"\n`);

  try {
    console.log('Generating response...');
    const response = await llmService.generateResponse(query, trendData, salesSchema);

    console.log('\nAnswer:');
    console.log(response.answer);

    if (response.visualization) {
      console.log(`\nChart Type: ${response.visualization.type}`);
      console.log(`X-Axis: ${response.visualization.dataMapping.xAxis}`);
      console.log(`Y-Axis: ${response.visualization.dataMapping.yAxis}`);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function example3_FilterQuery() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 3: Filtering Query');
  console.log('='.repeat(60));

  const llmService = new LLMService();
  const query = 'Show me all sales with revenue above $5000';

  console.log(`\nUser Query: "${query}"\n`);

  try {
    // Analyze to understand filtering requirements
    const analysis = await llmService.analyzeQuery(query, salesSchema, salesPreview);
    console.log('Analysis:');
    console.log(`- Intent: ${analysis.intent}`);
    console.log(`- Needs visualization: ${analysis.needsVisualization}`);
    console.log(`- Aggregation: ${analysis.aggregation || 'none'}`);

    // Simulated filtered data
    const filteredData = [
      { Date: '2024-03-15', Product: 'Widget C', Quantity: 50, Revenue: 10000 },
      { Date: '2024-04-22', Product: 'Widget B', Quantity: 75, Revenue: 11250 },
      { Date: '2024-05-10', Product: 'Widget A', Quantity: 120, Revenue: 12000 },
    ];

    const response = await llmService.generateResponse(query, filteredData, salesSchema);
    console.log('\nResponse:');
    console.log(response.answer);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function example4_ErrorHandling() {
  console.log('\n' + '='.repeat(60));
  console.log('Example 4: Error Handling');
  console.log('='.repeat(60));

  try {
    // Attempt to create service without API key
    const serviceWithoutKey = new LLMService('invalid-key');
    await serviceWithoutKey.testConnection();
  } catch (error) {
    console.log('\nExpected error caught:');
    console.log(error instanceof Error ? error.message : 'Unknown error');
  }

  // Demonstrate graceful error handling
  console.log('\n\nProper error handling pattern:');
  console.log(`
  try {
    const response = await llmService.generateResponse(query, data, schema);
    return { success: true, data: response };
  } catch (error) {
    console.error('LLM Service Error:', error);
    return {
      success: false,
      error: 'Unable to process your query right now. Please try again.',
    };
  }
  `);
}

async function runExamples() {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(10) + 'LLM Service Usage Examples' + ' '.repeat(21) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here') {
    console.log('\n⚠️  ANTHROPIC_API_KEY not configured');
    console.log('These examples require a valid API key to run.');
    console.log('\nTo set up:');
    console.log('1. Get your API key from https://console.anthropic.com/');
    console.log('2. Add to .env.local: ANTHROPIC_API_KEY=your_actual_key');
    console.log('3. Restart and run this script again\n');

    // Show example structure without API calls
    console.log('\n' + '='.repeat(60));
    console.log('Example Code Structure (API calls disabled)');
    console.log('='.repeat(60));

    console.log(`
// Initialize service
const llmService = new LLMService();

// Phase 1: Analyze query
const analysis = await llmService.analyzeQuery(
  "Which product sold the most?",
  schema,
  preview
);

// Use analysis to query data
const data = fetchDataBasedOnAnalysis(analysis);

// Phase 2: Generate response
const response = await llmService.generateResponse(
  "Which product sold the most?",
  data,
  schema
);

// Use the response
console.log(response.answer);
if (response.visualization) {
  renderChart(response.visualization);
}
    `);

    // Still show error handling example
    await example4_ErrorHandling();
    return;
  }

  // Run all examples
  try {
    await example1_SimpleQuery();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await example2_TrendQuery();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await example3_FilterQuery();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await example4_ErrorHandling();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Run examples
runExamples().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
