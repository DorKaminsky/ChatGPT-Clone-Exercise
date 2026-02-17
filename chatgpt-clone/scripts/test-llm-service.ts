#!/usr/bin/env node

/**
 * Test script for LLM Service
 * Tests query analysis and response generation with diverse query types
 */

import { LLMService } from '../lib/llm-service.js';
import type { DataSchema } from '../lib/types.js';

// Sample sales data schema (matching sample-sales-data.xlsx)
const sampleSchema: DataSchema = {
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
const samplePreview = [
  { Date: '2024-01-01', Region: 'North', Product: 'Widget A', Quantity: 10, Price: 100, Revenue: 1000 },
  { Date: '2024-01-02', Region: 'South', Product: 'Widget B', Quantity: 25, Price: 150, Revenue: 3750 },
  { Date: '2024-01-03', Region: 'East', Product: 'Widget C', Quantity: 15, Price: 200, Revenue: 3000 },
  { Date: '2024-01-04', Region: 'West', Product: 'Widget A', Quantity: 20, Price: 100, Revenue: 2000 },
  { Date: '2024-01-05', Region: 'North', Product: 'Widget B', Quantity: 30, Price: 150, Revenue: 4500 },
];

// Sample data for response generation
const sampleDataByProduct = [
  { Product: 'Widget A', TotalQuantity: 350, TotalRevenue: 35000 },
  { Product: 'Widget B', TotalQuantity: 450, TotalRevenue: 67500 },
  { Product: 'Widget C', TotalQuantity: 280, TotalRevenue: 56000 },
];

const sampleDataByRegion = [
  { Region: 'North', Revenue: 45000, Percentage: 28.5 },
  { Region: 'South', Revenue: 52000, Percentage: 32.9 },
  { Region: 'East', Revenue: 38000, Percentage: 24.1 },
  { Region: 'West', Revenue: 23000, Percentage: 14.5 },
];

const sampleDataTrend = [
  { Date: '2024-01', Revenue: 25000 },
  { Date: '2024-02', Revenue: 32000 },
  { Date: '2024-03', Revenue: 28000 },
  { Date: '2024-04', Revenue: 38000 },
  { Date: '2024-05', Revenue: 42000 },
];

const sampleDataFiltered = [
  { Date: '2024-03-15', Product: 'Widget C', Quantity: 50, Revenue: 10000 },
  { Date: '2024-04-22', Product: 'Widget B', Quantity: 75, Revenue: 11250 },
  { Date: '2024-05-10', Product: 'Widget A', Quantity: 120, Revenue: 12000 },
];

const sampleDataAverage = [
  { Region: 'North', AvgRevenue: 4500 },
  { Region: 'South', AvgRevenue: 5200 },
  { Region: 'East', AvgRevenue: 3800 },
  { Region: 'West', AvgRevenue: 2300 },
];

// Test queries covering diverse scenarios
const testQueries = [
  {
    name: 'Comparison Query',
    query: 'Which product sold the most?',
    expectedIntent: 'product comparison',
    expectedAggregation: 'groupby',
    expectedVisualization: true,
    responseData: sampleDataByProduct,
  },
  {
    name: 'Proportion Query',
    query: 'What is the sales percentage by region?',
    expectedIntent: 'regional distribution',
    expectedAggregation: 'groupby',
    expectedVisualization: true,
    responseData: sampleDataByRegion,
  },
  {
    name: 'Trend Query',
    query: 'Show me revenue over time',
    expectedIntent: 'trend analysis',
    expectedAggregation: 'groupby',
    expectedVisualization: true,
    responseData: sampleDataTrend,
  },
  {
    name: 'Filter Query',
    query: 'Show me all orders with revenue above $10000',
    expectedIntent: 'filtered data',
    expectedAggregation: 'none',
    expectedVisualization: false,
    responseData: sampleDataFiltered,
  },
  {
    name: 'Aggregation Query',
    query: 'What is the average sales per region?',
    expectedIntent: 'regional average',
    expectedAggregation: 'average',
    expectedVisualization: true,
    responseData: sampleDataAverage,
  },
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`! ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`  ${message}`, colors.blue);
}

async function testQueryAnalysis(llmService: LLMService, testCase: any) {
  logSection(`Test: ${testCase.name} - Query Analysis`);
  logInfo(`Query: "${testCase.query}"`);

  try {
    const analysis = await llmService.analyzeQuery(
      testCase.query,
      sampleSchema,
      samplePreview
    );

    console.log('\n' + 'Analysis Result:');
    console.log(JSON.stringify(analysis, null, 2));

    // Validate results
    let passed = true;

    if (!analysis.intent) {
      logError('Missing intent');
      passed = false;
    } else {
      logSuccess(`Intent: ${analysis.intent}`);
    }

    if (!analysis.dataNeeded.columns || analysis.dataNeeded.columns.length === 0) {
      logError('Missing required columns');
      passed = false;
    } else {
      logSuccess(`Columns needed: ${analysis.dataNeeded.columns.join(', ')}`);
    }

    if (analysis.aggregation) {
      const validAggregations = ['sum', 'count', 'average', 'groupby', 'none'];
      if (validAggregations.includes(analysis.aggregation)) {
        logSuccess(`Aggregation: ${analysis.aggregation}`);
      } else {
        logError(`Invalid aggregation: ${analysis.aggregation}`);
        passed = false;
      }
    }

    if (typeof analysis.needsVisualization !== 'boolean') {
      logError('needsVisualization must be boolean');
      passed = false;
    } else {
      logSuccess(`Needs visualization: ${analysis.needsVisualization}`);
    }

    return { passed, analysis };
  } catch (error) {
    logError(`Query analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(error);
    return { passed: false, analysis: null };
  }
}

async function testResponseGeneration(
  llmService: LLMService,
  testCase: any
) {
  logSection(`Test: ${testCase.name} - Response Generation`);
  logInfo(`Query: "${testCase.query}"`);

  try {
    const response = await llmService.generateResponse(
      testCase.query,
      testCase.responseData,
      sampleSchema
    );

    console.log('\n' + 'Response Result:');
    console.log(JSON.stringify(response, null, 2));

    // Validate results
    let passed = true;

    if (!response.answer || response.answer.trim().length === 0) {
      logError('Missing or empty answer');
      passed = false;
    } else {
      logSuccess('Answer provided');
      logInfo(`Answer: ${response.answer.substring(0, 100)}${response.answer.length > 100 ? '...' : ''}`);
    }

    if (response.visualization) {
      const validTypes = ['bar', 'pie', 'line', 'scatter', 'table'];
      if (!validTypes.includes(response.visualization.type)) {
        logError(`Invalid visualization type: ${response.visualization.type}`);
        passed = false;
      } else {
        logSuccess(`Visualization type: ${response.visualization.type}`);
      }

      if (!response.visualization.reason) {
        logWarning('Missing visualization reason');
      } else {
        logInfo(`Reason: ${response.visualization.reason}`);
      }

      if (!response.visualization.dataMapping) {
        logError('Missing data mapping');
        passed = false;
      } else {
        logSuccess('Data mapping provided');
        logInfo(`Mapping: ${JSON.stringify(response.visualization.dataMapping)}`);
      }
    } else {
      logInfo('No visualization provided');
    }

    return { passed, response };
  } catch (error) {
    logError(`Response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(error);
    return { passed: false, response: null };
  }
}

async function runTests() {
  logSection('LLM Service Test Suite');

  // Initialize LLM service
  let llmService: LLMService;
  try {
    llmService = new LLMService();
    logSuccess('LLM Service initialized');
  } catch (error) {
    logError(`Failed to initialize LLM Service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logWarning('Make sure ANTHROPIC_API_KEY is set in .env.local');
    process.exit(1);
  }

  // Test connection
  logSection('Connection Test');
  try {
    const connected = await llmService.testConnection();
    if (connected) {
      logSuccess('Successfully connected to Claude API');
    } else {
      logError('Failed to connect to Claude API');
      process.exit(1);
    }
  } catch (error) {
    logError(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }

  // Run test cases
  const results = {
    total: testQueries.length * 2, // Both phases for each query
    passed: 0,
    failed: 0,
  };

  for (const testCase of testQueries) {
    // Phase 1: Query Analysis
    const analysisResult = await testQueryAnalysis(llmService, testCase);
    if (analysisResult.passed) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Wait a bit to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Phase 2: Response Generation
    const responseResult = await testResponseGeneration(llmService, testCase);
    if (responseResult.passed) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Wait between test cases
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  logSection('Test Summary');
  console.log(`Total tests: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    log('\n🎉 All tests passed!', colors.green + colors.bright);
  } else {
    log('\n⚠️  Some tests failed. Review the output above.', colors.yellow + colors.bright);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  console.error(error);
  process.exit(1);
});
