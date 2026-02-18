#!/usr/bin/env node

/**
 * Phase 1 E2E Tests
 * Tests all 6 implemented features
 */

import { readFileSync } from 'fs';

console.log('🧪 Phase 1 E2E Testing\n');
console.log('=' .repeat(60));

const baseUrl = 'http://localhost:3000';
const results = {
  passed: [],
  failed: [],
};

function pass(test) {
  console.log(`✅ ${test}`);
  results.passed.push(test);
}

function fail(test, reason) {
  console.log(`❌ ${test}`);
  console.log(`   Reason: ${reason}`);
  results.failed.push({ test, reason });
}

// Test 1: Server is running
console.log('\n📡 Test 1: Server Health Check');
try {
  const response = await fetch(baseUrl);
  if (response.ok) {
    pass('Server is running and responding');
  } else {
    fail('Server health check', `Status: ${response.status}`);
  }
} catch (error) {
  fail('Server health check', error.message);
}

// Test 2: Sample data file exists
console.log('\n📊 Test 2: Sample Data File');
try {
  const response = await fetch(`${baseUrl}/sample-sales-data.xlsx`);
  if (response.ok) {
    pass('Sample data file is accessible');
  } else {
    fail('Sample data file', `Status: ${response.status}`);
  }
} catch (error) {
  fail('Sample data file', error.message);
}

// Test 3: API endpoints exist
console.log('\n🔌 Test 3: API Endpoints');
try {
  // Test models endpoint
  const modelsResponse = await fetch(`${baseUrl}/api/models`);
  if (modelsResponse.ok) {
    const data = await modelsResponse.json();
    if (data.models && data.models.length > 0) {
      pass(`Models API (${data.models.length} models available)`);
    } else {
      fail('Models API', 'No models returned');
    }
  } else {
    fail('Models API', `Status: ${modelsResponse.status}`);
  }
} catch (error) {
  fail('API endpoints', error.message);
}

// Test 4: Components exist
console.log('\n🎨 Test 4: Component Files');
const components = [
  'components/SuccessConfetti.tsx',
  'components/EmptyState.tsx',
  'components/Message.tsx',
  'components/ChatInterface.tsx',
  'components/FileUpload.tsx',
];

for (const component of components) {
  try {
    const content = readFileSync(component, 'utf-8');
    if (content.length > 0) {
      pass(`Component exists: ${component}`);
    }
  } catch (error) {
    fail(`Component: ${component}`, error.message);
  }
}

// Test 5: Feature implementations
console.log('\n✨ Test 5: Feature Implementations');

// Check for framer-motion usage
try {
  const messageComponent = readFileSync('components/Message.tsx', 'utf-8');
  if (messageComponent.includes('framer-motion')) {
    pass('Feature 1: Micro-animations (framer-motion imported)');
  } else {
    fail('Feature 1: Micro-animations', 'framer-motion not found');
  }

  if (messageComponent.includes('ContentCopy') || messageComponent.includes('clipboard')) {
    pass('Feature 3: Copy button implemented');
  } else {
    fail('Feature 3: Copy button', 'Copy functionality not found');
  }
} catch (error) {
  fail('Feature check', error.message);
}

// Check for loading messages
try {
  const loadingMessages = readFileSync('lib/loading-messages.ts', 'utf-8');
  if (loadingMessages.includes('LOADING_MESSAGES')) {
    pass('Feature 2: Loading messages utility exists');
  } else {
    fail('Feature 2: Loading messages', 'Utility not found');
  }
} catch (error) {
  fail('Feature 2: Loading messages', error.message);
}

// Check for sample data button
try {
  const pageComponent = readFileSync('app/page.tsx', 'utf-8');
  if (pageComponent.includes('loadSampleData') || pageComponent.includes('Try with Sample Data')) {
    pass('Feature 4: Sample data button implemented');
  } else {
    fail('Feature 4: Sample data button', 'Button not found');
  }

  if (pageComponent.includes('SuccessConfetti')) {
    pass('Feature 5: Confetti integrated in page');
  } else {
    fail('Feature 5: Confetti', 'Not found in page');
  }
} catch (error) {
  fail('Feature check', error.message);
}

// Check for empty state
try {
  const emptyState = readFileSync('components/EmptyState.tsx', 'utf-8');
  if (emptyState.includes('EmptyState')) {
    pass('Feature 6: Empty state component exists');
  } else {
    fail('Feature 6: Empty state', 'Component not found');
  }
} catch (error) {
  fail('Feature 6: Empty state', error.message);
}

// Test 6: Upload and chat flow
console.log('\n🔄 Test 6: Full Upload & Chat Flow');
try {
  // Load sample file
  const fileResponse = await fetch(`${baseUrl}/sample-sales-data.xlsx`);
  const fileBlob = await fileResponse.blob();

  // Upload it
  const formData = new FormData();
  formData.append('file', fileBlob, 'sample-sales-data.xlsx');

  const uploadResponse = await fetch(`${baseUrl}/api/data/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    fail('Upload flow', `Upload failed: ${uploadResponse.status}`);
  } else {
    const uploadData = await uploadResponse.json();
    pass(`Upload successful (${uploadData.schema.rowCount} rows)`);

    // Test chat endpoint
    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Which product sold the most?',
        dataSourceId: uploadData.dataSourceId,
      }),
    });

    if (!chatResponse.ok) {
      fail('Chat flow', `Chat failed: ${chatResponse.status}`);
    } else {
      const chatData = await chatResponse.json();
      if (chatData.textResponse) {
        pass('Chat response generated successfully');
      }
      if (chatData.visualization) {
        pass('Visualization generated successfully');
      } else {
        console.log('   ℹ️  No visualization (may be expected for this query)');
      }
    }
  }
} catch (error) {
  fail('Upload & chat flow', error.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`📈 Success Rate: ${Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100)}%`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failed.forEach(({ test, reason }) => {
    console.log(`   - ${test}: ${reason}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed! Phase 1 is ready.');
  process.exit(0);
}
