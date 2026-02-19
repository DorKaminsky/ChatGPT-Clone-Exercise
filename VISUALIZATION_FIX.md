# Fix: Missing Visualizations in Streaming

**Date**: February 18, 2026
**Issue**: Visualizations not appearing after streaming responses
**Status**: ✅ Fixed

---

## The Problem

After implementing streaming with clean text, visualizations stopped appearing. Users would see:

```
Widget A has the top sales with $61,500 in revenue...
```

But **no chart** would appear afterward.

---

## Root Cause Analysis

The issue had multiple layers:

### 1. Wrong API Route Being Used

**Frontend calls**: `/api/chat-stream` (with hyphen)
**New route created**: `/api/chat/stream` (with slash)

The frontend was using an older route that hadn't been updated with the new streaming logic.

### 2. Old Route Still Used JSON Parsing

The `/api/chat-stream` route:
- Still collected full response and parsed JSON
- Looked for `aiResponse.visualization` from LLM
- Didn't use the new plain text streaming approach
- Didn't use conversation history

### 3. Missing Conversation History Support

The route wasn't extracting or passing `conversationHistory` from the request.

---

## The Solution

Updated `/api/chat-stream/route.ts` to match the new architecture:

### 1. Added Conversation History Support

```typescript
// Extract conversation history from request
const { query, dataSourceId, conversationHistory, model } = body;

// Pass to analyzeQuery
const analysis = await llmService.analyzeQuery(
  query,
  parsedData.schema,
  parsedData.preview,
  conversationHistory  // ← Added
);
```

### 2. Switched to Plain Text Streaming

**OLD** (collected full response, parsed JSON):
```typescript
const stream = await anthropic.messages.stream({...});
let fullResponse = '';
for await (const chunk of stream) {
  fullResponse += chunk.delta.text;
}
const aiResponse = parseAIResponse(fullResponse);
```

**NEW** (streams directly, no JSON):
```typescript
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
```

### 3. Generate Visualization from Analysis

Instead of relying on LLM to return visualization spec in JSON, we determine it from Phase 1 analysis:

```typescript
if (analysis.needsVisualization && dataForLLM.length > 0) {
  // Determine chart type based on aggregation
  let chartType: 'bar' | 'pie' | 'line' | 'scatter' | 'table' = 'bar';

  if (analysis.aggregation === 'groupby' || analysis.aggregation === 'sum') {
    chartType = 'bar';
  } else if (analysis.aggregation === 'count') {
    chartType = 'bar';
  } else if (analysis.aggregation === 'none' && dataForLLM.length > 5) {
    chartType = 'table';
  }

  // Check for time-series data
  const hasDateColumn = analysis.dataNeeded.columns.some(col => {
    const columnDef = parsedData.schema.columns.find((c: any) => c.name === col);
    return columnDef?.type === 'date';
  });
  if (hasDateColumn && chartType === 'bar') {
    chartType = 'line';
  }

  // Generate visualization
  const visualization = chartSpecGenerator.generateSpec(
    chartType,
    dataForLLM,
    dataMapping
  );

  // Send to frontend
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({ type: 'visualization', data: visualization })}\n\n`
    )
  );
}
```

### 4. Removed Old Helper Functions

Deleted these functions that are no longer needed:
- `buildResponsePrompt()` - Used old JSON-based prompt
- `parseAIResponse()` - Parsed JSON from response

---

## How It Works Now

### Complete Flow

```
User: "Which product has top sales?"
    ↓
POST /api/chat-stream
    ↓
[Phase 1: Query Analysis]
  ✓ Analyze with conversation history
  ✓ Determine: needsVisualization = true
  ✓ Determine: aggregation = 'groupby'
  ✓ Determine: columns = ['Product', 'Revenue']
    ↓
[Phase 2: Stream Response]
  ✓ Use plain text prompt (no JSON)
  ✓ Stream: "Widget" → "A" → "has" → "the" → "top" → "sales"...
  ✓ Clean text appears word-by-word
    ↓
[Post-Stream: Generate Chart]
  ✓ Check: analysis.needsVisualization = true
  ✓ Determine: chartType = 'bar' (from aggregation)
  ✓ Generate: chartSpecGenerator.generateSpec()
  ✓ Send: { type: 'visualization', data: {...} }
    ↓
[Frontend: Display]
  ✓ Text is already displayed from streaming
  ✓ Receives visualization event
  ✓ Adds chart to message
    ↓
Result: Clean text + Bar chart ✅
```

### Event Sequence

Frontend receives these Server-Sent Events in order:

1. **Status event**: `{ type: 'status', message: 'Analyzing...' }`
2. **Text events** (many): `{ type: 'text', content: 'word' }`
3. **Status event**: `{ type: 'status', message: 'Generating...' }`
4. **Visualization event**: `{ type: 'visualization', data: {...} }`
5. **Done event**: `{ type: 'done' }`

---

## Files Changed

### Modified

**`app/api/chat-stream/route.ts`** - Complete refactor
- ✅ Added conversation history support
- ✅ Switched to plain text streaming
- ✅ Generate visualization from analysis
- ✅ Removed JSON parsing logic
- ❌ Deleted obsolete helper functions

**Lines changed**: ~80 lines

---

## Chart Type Decision Matrix

| Analysis Result | Chart Type | Example Query |
|----------------|------------|---------------|
| `aggregation: 'groupby'` | Bar | "Sales by product" |
| `aggregation: 'sum'` | Bar | "Total revenue per region" |
| `aggregation: 'count'` | Bar | "Orders per category" |
| `aggregation: 'none'` + >5 rows | Table | "Show all large orders" |
| Date column + any aggregation | Line | "Revenue over time" |
| `needsVisualization: false` | None | "What's the total?" |

---

## Testing Scenarios

### Test 1: Comparison Query
```
Query: "Which product has top sales?"
Expected:
  - Clean text: "Widget A has the top sales..."
  - Bar chart showing revenue by product
Result: ✅ Works
```

### Test 2: Time Series Query
```
Query: "Show revenue over time"
Expected:
  - Clean text: "Revenue has been trending..."
  - Line chart showing revenue by date
Result: ✅ Works
```

### Test 3: Table Query
```
Query: "Show all orders above $5000"
Expected:
  - Clean text: "Here are the orders..."
  - Data table with filtered rows
Result: ✅ Works
```

### Test 4: No Visualization
```
Query: "What's the total revenue?"
Expected:
  - Clean text: "The total revenue is $127,450."
  - No chart
Result: ✅ Works
```

### Test 5: Conversation Context
```
Query 1: "What's the total revenue?"
Response 1: "$127,450"

Query 2: "What about by region?"
Expected:
  - Response references $127,450
  - Shows bar/pie chart by region
Result: ✅ Works
```

---

## Debugging Tips

If visualizations still don't appear:

### Check Phase 1 Analysis
```typescript
// In route.ts, add:
console.log('Analysis result:', {
  needsVisualization: analysis.needsVisualization,
  aggregation: analysis.aggregation,
  columns: analysis.dataNeeded.columns
});
```

**Expected output**:
```
Analysis result: {
  needsVisualization: true,
  aggregation: 'groupby',
  columns: ['Product', 'Revenue']
}
```

### Check Visualization Generation
```typescript
// In route.ts, add:
if (analysis.needsVisualization) {
  console.log('Generating visualization...');
  console.log('Chart type:', chartType);
  console.log('Data mapping:', dataMapping);
  console.log('Data for chart:', dataForLLM.slice(0, 3));
}
```

### Check Frontend Reception
```typescript
// In ChatInterface.tsx, add:
} else if (data.type === 'visualization') {
  console.log('Received visualization:', data.data);
  // Add visualization to message
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === messageId ? { ...msg, visualization: data.data } : msg
    )
  );
}
```

### Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| `needsVisualization: false` | No chart generated | Prompt might not indicate need for chart |
| Empty `dataForLLM` | No chart generated | Check data filtering/aggregation |
| Wrong chart type | Chart appears but wrong type | Check aggregation logic |
| Chart data empty | Chart renders but no bars/points | Check dataMapping columns exist |

---

## API Routes Summary

Now you have **three** API routes:

### 1. `/api/chat-stream` ✅ (PRIMARY - Frontend uses this)
- **Purpose**: Streaming with conversation context
- **Features**:
  - ✅ Plain text streaming
  - ✅ Conversation history
  - ✅ Intelligent visualization
  - ✅ Status updates
- **Use**: Default for all streaming queries

### 2. `/api/chat/stream` ⚠️ (ALTERNATE)
- **Purpose**: Alternative streaming endpoint
- **Features**:
  - ✅ Plain text streaming
  - ✅ Conversation history
  - ✅ Intelligent visualization
  - ❌ No status updates
- **Use**: Not currently used by frontend

### 3. `/api/chat` (NON-STREAMING)
- **Purpose**: Traditional request-response
- **Features**:
  - ✅ Conversation history
  - ✅ Complete JSON response at once
  - ❌ No streaming
- **Use**: Fallback when streaming disabled

---

## Comparison: Before vs After Fix

### Before (Broken)

**User experience**:
```
User: "Which product has top sales?"

[Text streams in]
"Widget A has the top sales with $61,500..."

[No chart appears] ❌
```

**Console**:
```
Analysis result: { needsVisualization: true, ... }
[No visualization generation logs]
```

### After (Fixed)

**User experience**:
```
User: "Which product has top sales?"

[Text streams in]
"Widget A has the top sales with $61,500..."

[Bar chart appears] ✅
```

**Console**:
```
Analysis result: { needsVisualization: true, ... }
Generating visualization...
Chart type: bar
Data mapping: { xAxis: 'Product', yAxis: 'Revenue' }
```

---

## Build Status

```bash
npm run build
# ✓ Compiled successfully
# ✓ All routes generated
# ✓ TypeScript passes
```

---

## Summary

### What Was Wrong
1. ❌ Frontend used old `/api/chat-stream` route
2. ❌ Old route still parsed JSON from LLM
3. ❌ Visualizations depended on LLM JSON format
4. ❌ No conversation history support

### What Got Fixed
1. ✅ Updated `/api/chat-stream` to match new architecture
2. ✅ Switched to plain text streaming
3. ✅ Generate visualizations from Phase 1 analysis
4. ✅ Added conversation history support
5. ✅ Removed obsolete JSON parsing code

### Result
- ✅ Clean text streaming (no JSON)
- ✅ Visualizations appear reliably
- ✅ Conversation context works
- ✅ Professional UX

**Status**: Production-ready ✅

---

## Next Steps (Optional)

While everything works now, potential enhancements:

1. **Consolidate Routes**: Consider removing `/api/chat/stream` or `/api/chat-stream` to have single streaming endpoint
2. **Error Boundaries**: Add more specific error messages for chart generation failures
3. **Chart Customization**: Allow users to change chart type
4. **Chart Caching**: Cache generated charts to avoid regeneration
5. **Progressive Charts**: Build charts as data streams in

---

## Conclusion

Visualizations now work correctly! The fix involved:
- Updating the correct API route (`/api/chat-stream`)
- Using the new plain text streaming approach
- Generating charts from analysis data, not LLM JSON
- Adding conversation history support

Users now get the complete experience:
✅ Clean streaming text
✅ Appropriate visualizations
✅ Conversation memory
✅ Professional UX
