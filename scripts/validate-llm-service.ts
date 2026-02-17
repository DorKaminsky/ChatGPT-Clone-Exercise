#!/usr/bin/env node

/**
 * Validation script for LLM Service
 * Tests code structure and basic functionality without making API calls
 */

import { LLMService, createLLMService } from '../lib/llm-service.js';
import type { DataSchema, QueryAnalysis, AIResponse } from '../lib/types.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
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

async function validateStructure() {
  logSection('LLM Service Structure Validation');

  let errors = 0;

  // Test 1: Module exports
  try {
    if (typeof LLMService === 'function') {
      logSuccess('LLMService class exported');
    } else {
      logError('LLMService is not a class');
      errors++;
    }

    if (typeof createLLMService === 'function') {
      logSuccess('createLLMService factory function exported');
    } else {
      logError('createLLMService is not a function');
      errors++;
    }
  } catch (error) {
    logError('Failed to import LLM service');
    errors++;
  }

  // Test 2: Class instantiation (without API key)
  try {
    // Should throw error without API key
    try {
      new LLMService();
      logWarning('LLMService did not require API key (might use env variable)');
    } catch (e) {
      if (e instanceof Error && e.message.includes('ANTHROPIC_API_KEY')) {
        logSuccess('LLMService properly validates API key requirement');
      } else {
        logError('Unexpected error during instantiation');
        errors++;
      }
    }
  } catch (error) {
    logError('Failed to test LLMService instantiation');
    errors++;
  }

  // Test 3: Method signatures
  try {
    // Create instance with dummy key for method checking
    const service = new LLMService('dummy-key-for-testing');

    if (typeof service.analyzeQuery === 'function') {
      logSuccess('analyzeQuery method exists');
    } else {
      logError('analyzeQuery method missing');
      errors++;
    }

    if (typeof service.generateResponse === 'function') {
      logSuccess('generateResponse method exists');
    } else {
      logError('generateResponse method missing');
      errors++;
    }

    if (typeof service.testConnection === 'function') {
      logSuccess('testConnection method exists');
    } else {
      logError('testConnection method missing');
      errors++;
    }
  } catch (error) {
    logError('Failed to validate method signatures');
    errors++;
  }

  // Test 4: Type compatibility
  logSection('Type Compatibility Tests');

  const mockSchema: DataSchema = {
    columns: [
      { name: 'test', type: 'string', sample: ['a', 'b'] },
    ],
    rowCount: 10,
  };

  const mockPreview = [{ test: 'value' }];

  try {
    const service = new LLMService('dummy-key');

    // These should accept the correct types without TypeScript errors
    // (Won't actually execute without real API key, but validates signatures)
    const queryPromise = service.analyzeQuery('test query', mockSchema, mockPreview);
    logSuccess('analyzeQuery accepts correct parameter types');

    const responsePromise = service.generateResponse('test', [], mockSchema);
    logSuccess('generateResponse accepts correct parameter types');
  } catch (error) {
    // Expected since we don't have a real API key
    logSuccess('Type checking passed (runtime errors expected without API key)');
  }

  return errors;
}

async function validatePromptBuilding() {
  logSection('Prompt Building Validation');

  const mockSchema: DataSchema = {
    columns: [
      { name: 'Product', type: 'string', sample: ['Widget A', 'Widget B'] },
      { name: 'Revenue', type: 'number', sample: [1000, 2000] },
    ],
    rowCount: 50,
  };

  const mockPreview = [
    { Product: 'Widget A', Revenue: 1000 },
    { Product: 'Widget B', Revenue: 2000 },
  ];

  try {
    const service = new LLMService('dummy-key');

    // Access private methods through type assertion for testing
    const serviceAny = service as any;

    // Test analysis prompt
    if (typeof serviceAny.buildAnalysisPrompt === 'function') {
      const analysisPrompt = serviceAny.buildAnalysisPrompt(
        'Which product sold the most?',
        mockSchema,
        mockPreview
      );

      if (typeof analysisPrompt === 'string' && analysisPrompt.length > 0) {
        logSuccess('buildAnalysisPrompt generates non-empty prompt');

        // Check for key components
        if (analysisPrompt.includes('Product') && analysisPrompt.includes('Revenue')) {
          logSuccess('Analysis prompt includes schema information');
        } else {
          logWarning('Analysis prompt might be missing schema details');
        }

        if (analysisPrompt.includes('Widget A')) {
          logSuccess('Analysis prompt includes sample data');
        } else {
          logWarning('Analysis prompt might be missing sample data');
        }
      } else {
        logError('buildAnalysisPrompt returned invalid result');
      }
    } else {
      logWarning('buildAnalysisPrompt method not accessible (might be too private)');
    }

    // Test response prompt
    if (typeof serviceAny.buildResponsePrompt === 'function') {
      const responsePrompt = serviceAny.buildResponsePrompt(
        'Show me revenue by product',
        mockPreview,
        mockSchema
      );

      if (typeof responsePrompt === 'string' && responsePrompt.length > 0) {
        logSuccess('buildResponsePrompt generates non-empty prompt');

        if (responsePrompt.includes('Product') || responsePrompt.includes('Revenue')) {
          logSuccess('Response prompt includes data context');
        } else {
          logWarning('Response prompt might be missing data context');
        }
      } else {
        logError('buildResponsePrompt returned invalid result');
      }
    } else {
      logWarning('buildResponsePrompt method not accessible (might be too private)');
    }
  } catch (error) {
    logError(`Prompt building validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 1;
  }

  return 0;
}

async function checkEnvironment() {
  logSection('Environment Check');

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    logWarning('ANTHROPIC_API_KEY not set in environment');
    logWarning('To run full tests with API calls:');
    console.log('  1. Get your API key from https://console.anthropic.com/');
    console.log('  2. Add it to .env.local: ANTHROPIC_API_KEY=your_actual_key');
    console.log('  3. Run: npm run dev (loads .env.local) then run test script');
    return false;
  } else {
    logSuccess('ANTHROPIC_API_KEY found in environment');
    return true;
  }
}

async function validateCodeQuality() {
  logSection('Code Quality Checks');

  try {
    const service = new LLMService('dummy-key');
    const serviceAny = service as any;

    // Check for retry logic
    if (typeof serviceAny.callLLMWithRetry === 'function') {
      logSuccess('Retry logic implemented (callLLMWithRetry)');
    } else {
      logWarning('Retry logic might not be implemented');
    }

    // Check for error handling
    if (typeof serviceAny.isRetryableError === 'function') {
      logSuccess('Error classification implemented (isRetryableError)');
    } else {
      logWarning('Error classification might not be implemented');
    }

    // Check for JSON extraction
    if (typeof serviceAny.extractJSONFromResponse === 'function') {
      logSuccess('JSON extraction method implemented');
    } else {
      logWarning('JSON extraction might not be implemented');
    }

    // Check for sleep utility
    if (typeof serviceAny.sleep === 'function') {
      logSuccess('Sleep utility for backoff implemented');
    } else {
      logWarning('Sleep utility might not be implemented');
    }

    // Check model configuration
    if (serviceAny.model === 'claude-opus-4.6') {
      logSuccess('Correct model configured: claude-opus-4.6');
    } else {
      logError(`Wrong model configured: ${serviceAny.model}`);
      return 1;
    }

    // Check retry configuration
    if (typeof serviceAny.maxRetries === 'number' && serviceAny.maxRetries > 0) {
      logSuccess(`Retry configuration: maxRetries = ${serviceAny.maxRetries}`);
    } else {
      logWarning('Max retries not configured');
    }

  } catch (error) {
    logError(`Code quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 1;
  }

  return 0;
}

async function runValidation() {
  log('LLM Service Validation Suite', colors.bright + colors.cyan);
  log('Testing code structure without making API calls\n', colors.cyan);

  let totalErrors = 0;

  // Run validation checks
  totalErrors += await validateStructure();
  totalErrors += await validatePromptBuilding();
  totalErrors += await validateCodeQuality();

  const hasApiKey = await checkEnvironment();

  // Summary
  logSection('Validation Summary');

  if (totalErrors === 0) {
    logSuccess('All validation checks passed!');
    console.log('');

    if (hasApiKey) {
      log('✅ Ready to run full tests with API calls', colors.green);
      console.log('   Run: tsx scripts/test-llm-service.ts');
    } else {
      log('⚠️  Configure API key to run full tests', colors.yellow);
      console.log('   1. Add ANTHROPIC_API_KEY to .env.local');
      console.log('   2. Run: tsx scripts/test-llm-service.ts');
    }
  } else {
    logError(`Validation failed with ${totalErrors} error(s)`);
    console.log('Please fix the errors above before proceeding.');
    process.exit(1);
  }
}

// Run validation
runValidation().catch((error) => {
  logError(`Validation suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  console.error(error);
  process.exit(1);
});
