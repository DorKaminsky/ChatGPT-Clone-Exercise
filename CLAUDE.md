# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI-powered data visualization tool that combines natural language queries with automatic chart generation. Users upload Excel files, ask questions in plain English, and receive intelligent text responses with beautiful visualizations.

**Tech Stack:**
- Next.js 16 (App Router) with React 19 and TypeScript
- Claude models (Sonnet 4, 3.5 Sonnet, Opus, Haiku) via Anthropic SDK
- Material-UI 6 for UI components
- Recharts for data visualizations
- xlsx library for Excel file parsing
- Zod for runtime validation
- Server-Sent Events (SSE) for streaming responses
- framer-motion for animations
- react-markdown for formatted text rendering

## Development Commands

```bash
npm run dev     # Start development server at http://localhost:3000
npm run build   # Build for production
npm start       # Start production server
npm run lint    # Run Next.js linter
```

## Environment Setup

Create `.env.local` in the project root:
```bash
ANTHROPIC_API_KEY=your_api_key_here
```

The API key is accessed server-side via `process.env.ANTHROPIC_API_KEY`. Never commit `.env.local` (it's in `.gitignore`).

## Architecture

### Two-Phase LLM Processing

The application uses a two-phase approach for query processing:

1. **Query Analysis Phase** (lib/llm-service.ts)
   - LLM analyzes user question + data schema + conversation history
   - Determines intent, required columns, filters, and aggregation type
   - Decides if visualization is needed
   - Returns structured JSON validated with Zod

2. **Response Generation Phase** (lib/llm-service.ts)
   - LLM streams plain text response (Server-Sent Events)
   - Generates natural language answer word-by-word
   - Chart type determined by Phase 1 analysis (not LLM)
   - Visualization sent as separate SSE event after text completes

**Conversation Memory**: The system maintains the last 10 messages (5 user-assistant pairs) for context-aware responses.

### Data Flow

```
User uploads Excel file
  ↓
POST /api/data/upload (app/api/data/upload/route.ts)
  ↓
DataService parses file with xlsx library (lib/data-service.ts)
  ↓
In-memory storage with UUID (persists across hot reloads)
  ↓
User asks question
  ↓
POST /api/chat-stream (app/api/chat-stream/route.ts) [PRIMARY]
  ↓
Phase 1: LLM analyzes query + conversation history → determines data needs
  ↓
Data filtering and aggregation applied
  ↓
Phase 2: LLM streams plain text response via SSE
  ↓
ChartSpecGenerator creates visualization from Phase 1 analysis
  ↓
Frontend renders streaming text + ChartRenderer component
  ↓
Conversation history updated (maintains last 10 messages)
```

### Key Services

**DataService (lib/data-service.ts)**
- Parses Excel files using xlsx library
- Infers column types (string, number, date, boolean)
- Stores data in-memory with UUID keys
- Provides CRUD operations for data sources
- Uses global store that persists across Next.js hot reloads

**LLMService (lib/llm-service.ts)**
- Manages Claude API interactions
- Supports multiple Claude models (configurable via constructor)
- Default model: `claude-3-5-sonnet-20241022` (can be overridden)
- Implements exponential backoff retry logic (3 attempts)
- Extracts JSON from LLM responses (handles markdown code blocks)
- Supports both standard and streaming responses via SSE
- Temperature: 0.3 for consistent JSON output
- Max tokens: 4096

**Key Methods:**
- `analyzeQuery()`: Returns structured QueryAnalysis with data needs
- `generateResponse()`: Returns complete AIResponse (non-streaming)
- `generateResponseStream()`: Async generator yielding text chunks for SSE streaming

**ChartSpecGenerator (lib/chart-spec-generator.ts)**
- Transforms raw data into Recharts-compatible formats
- Handles data extraction with nested field support (dot notation)
- Converts string numbers to numeric values (removes $, commas)
- Supports bar, pie, line, scatter, and table visualizations

### API Endpoints

**GET /api/models**
- Detects available Claude models based on API key tier
- Tests each known model with minimal request
- Returns: `{ models: ModelInfo[], defaultModel: string }`
- Models tested: Sonnet 4, 3.5 Sonnet, Opus, Haiku

**POST /api/data/upload**
- Accepts `multipart/form-data` with Excel file
- Returns: `{ dataSourceId, fileName, schema, preview }`

**POST /api/chat-stream** (PRIMARY ENDPOINT)
- Accepts: `{ query: string, dataSourceId: string, conversationHistory?: Array<{role, content}>, model?: string }`
- Returns: Server-Sent Events (SSE) stream with event types:
  - `status`: Progress updates ("Analyzing...", "Generating response...")
  - `text`: Streamed response chunks (word-by-word)
  - `visualization`: Chart data when applicable
  - `done`: Signals completion
  - `error`: Error messages
- Implements aggregation logic for sum, count, average, groupby operations

**POST /api/chat** (NON-STREAMING FALLBACK)
- Same request/response structure as `/api/chat-stream` but returns complete response
- Returns: `{ textResponse: string, visualization?: ChartData }`

## Important Implementation Details

### Module System
- Project uses ESM (`"type": "module"` in package.json)
- Import paths must include `.js` extension (e.g., `from './types.js'`)
- All imports use `import/export`, never `require()`

### Next.js App Router Patterns
- API routes must be named `route.ts` in `app/api/*/route.ts`
- Server components are default, client components need `'use client'` directive
- Path alias `@/*` maps to project root (tsconfig.json)

### In-Memory Data Storage
The DataService uses a global store pattern to persist data across Next.js hot reloads:
```typescript
const globalDataStore = globalThis as typeof globalThis & {
  __dataStore?: Map<string, ParsedData>;
};
```

This prevents data loss during development but resets on server restart (as intended for this prototype).

### LLM Response Parsing
Always handle potentially malformed JSON from LLM responses:
```typescript
// Extract JSON, stripping markdown code blocks if present
private extractJSONFromResponse(response: Message): string {
  let text = textBlock.text.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  }
  return text.trim();
}
```

### Chart Type Selection Matrix

| Query Pattern | Chart Type | Example |
|--------------|-----------|---------|
| Compare categories | Bar | "Which product sold most?" |
| Show proportions | Pie | "Sales % by region?" |
| Trends over time | Line | "Revenue over months?" |
| Correlations | Scatter | "Price vs quantity?" |
| Raw filtered data | Table | "Orders over $5000" |

### Aggregation Logic
The chat endpoints implement four aggregation types:
- **groupby**: Groups by first column, sums second column
- **sum**: Same as groupby (legacy)
- **average**: Groups by first column, averages second column
- **count**: Counts occurrences per group
- **none**: Returns raw data

### Server-Sent Events (SSE) Stream Format

The `/api/chat-stream` endpoint returns SSE events in this format:

```
data: {"type":"status","message":"Analyzing your question..."}

data: {"type":"status","message":"Generating response..."}

data: {"type":"text","content":"The"}

data: {"type":"text","content":" highest"}

data: {"type":"text","content":" selling"}

data: {"type":"visualization","data":{"type":"bar","data":[...],"config":{...}}}

data: {"type":"done"}
```

**Event Types:**
- `status`: Progress indicator (shown before text starts)
- `text`: Individual text chunks (accumulated for display)
- `visualization`: Chart data (sent after text completes)
- `done`: Stream completion signal
- `error`: Error messages

## File Structure

```
/
├── app/
│   ├── api/
│   │   ├── chat-stream/route.ts       # Streaming query endpoint (PRIMARY)
│   │   ├── chat/route.ts              # Non-streaming fallback endpoint
│   │   ├── models/route.ts            # Model detection endpoint
│   │   └── data/upload/route.ts       # File upload endpoint
│   ├── demo-charts/page.tsx           # Chart component demo page
│   ├── layout.tsx                     # Root layout with metadata
│   ├── page.tsx                       # Main application page
│   ├── theme.ts                       # Material-UI theme config
│   ├── ThemeProvider.tsx              # MUI theme provider wrapper
│   └── globals.css                    # Global styles
├── components/
│   ├── ChatInterface.tsx              # Chat UI with streaming support
│   ├── Message.tsx                    # Message display with markdown
│   ├── FileUpload.tsx                 # Drag-drop file upload
│   └── ChartRenderer.tsx              # Dynamic chart rendering
├── lib/
│   ├── types.ts                       # TypeScript type definitions
│   ├── data-service.ts                # Excel parsing & in-memory storage
│   ├── llm-service.ts                 # Claude API integration (streaming + non-streaming)
│   ├── chart-spec-generator.ts        # Data transformation for charts
│   └── __tests__/
│       └── chart-spec-generator.test.ts  # Test suite for chart generator
├── public/
│   └── sample-sales-data.xlsx         # Sample data file (20 rows)
├── docs/                              # Phase documentation and specs
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── next.config.ts                     # Next.js configuration
├── .env.local                         # Environment variables (git-ignored)
├── CLAUDE.md                          # This file
└── README.md                          # Project overview
```

## Common Patterns

### Creating a New API Route
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Process request...
    return NextResponse.json({ result: 'success' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Using the LLM Service
```typescript
import { LLMService } from '@/lib/llm-service';

// Initialize with optional model override
const llmService = new LLMService(undefined, 'claude-sonnet-4-20250514');

// Phase 1: Analyze query (with conversation history)
const analysis = await llmService.analyzeQuery(
  query,
  schema,
  preview,
  conversationHistory // Array of {role, content}
);

// Phase 2: Generate response (non-streaming)
const response = await llmService.generateResponse(
  query,
  data,
  schema,
  conversationHistory
);

// Phase 2: Generate response (streaming)
for await (const chunk of llmService.generateResponseStream(
  query,
  data,
  schema,
  conversationHistory
)) {
  console.log(chunk); // Each text chunk
}
```

### Client Component Pattern
```typescript
'use client'; // Required for useState, useEffect, event handlers

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState(null);
  // Component logic...
}
```

### Managing Conversation History
```typescript
// In ChatInterface.tsx
const [conversationHistory, setConversationHistory] = useState<
  Array<{ role: 'user' | 'assistant'; content: string }>
>([]);

// Add messages to history (keep last 10 messages)
const addToHistory = (role: 'user' | 'assistant', content: string) => {
  setConversationHistory(prev => {
    const updated = [...prev, { role, content }];
    return updated.slice(-10); // Keep last 10 only
  });
};

// Send history with each request
const response = await fetch('/api/chat-stream', {
  method: 'POST',
  body: JSON.stringify({
    query,
    dataSourceId,
    conversationHistory, // Include for context-aware responses
    model: selectedModel
  })
});
```

### Consuming SSE Streams
```typescript
// Frontend pattern for consuming Server-Sent Events
const response = await fetch('/api/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, dataSourceId, conversationHistory })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      switch (data.type) {
        case 'status':
          // Show loading message
          break;
        case 'text':
          // Append to accumulated text
          accumulatedText += data.content;
          break;
        case 'visualization':
          // Set chart data
          setVisualization(data.data);
          break;
        case 'done':
          // Complete the message
          break;
        case 'error':
          // Handle error
          break;
      }
    }
  }
}
```

## Testing

The project includes a test suite for the chart spec generator (lib/__tests__/chart-spec-generator.test.ts). Tests demonstrate:
- Bar, pie, line, scatter, and table chart generation
- Handling empty data and missing fields
- Nested field path extraction
- String-to-number conversions

No test runner is currently configured. To add testing:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

## Known Limitations

1. **No persistence**: Data is stored in-memory only (resets on server restart)
2. **Single data source**: UI supports only one uploaded file at a time
3. **Limited conversation history**: Maintains only last 10 messages (5 pairs) for context
4. **Basic aggregation**: Filter logic is simplified (app/api/chat-stream/route.ts)
5. **Model availability**: Available models depend on API key tier
6. **First sheet only**: Multi-sheet Excel files use only first sheet
7. **Row limit**: Max 100 rows sent to LLM for performance

## Important Notes

- **Model Selection**: Default model is `claude-3-5-sonnet-20241022`. Users can select from available models via UI dropdown. Available models are auto-detected at startup via `/api/models` endpoint.
- **Model Configuration**: To change the default model, update the default in `app/api/models/route.ts` or pass `model` parameter in chat requests
- **Streaming Architecture**: The application uses Server-Sent Events (SSE) for real-time streaming. The frontend consumes events via EventSource API.
- **Data Limits**: Chat endpoints send max 100 rows to LLM to manage token usage
- **Excel Format**: Only first sheet is processed. Multi-sheet files will ignore additional sheets.
- **Type Inference**: Column types are inferred by sampling first 100 rows with 80% threshold
- **Hot Reload**: Data persists across Next.js hot reloads but not server restarts
- **Conversation Context**: Only last 10 messages (5 user-assistant pairs) are sent to LLM to manage token usage
- **Chart Generation**: Charts are generated from Phase 1 analysis, not LLM output, for consistency and reliability
- **Material-UI**: Uses version 6 with Emotion for styling
- **Path Aliases**: `@/*` imports resolve to project root

## Troubleshooting

**"API key not found" error**
- Verify `.env.local` exists in project root with `ANTHROPIC_API_KEY=...`
- Restart dev server after adding environment variables

**"Data source not found" error**
- Upload file before querying
- Check that dataSourceId is being passed correctly to /api/chat

**Charts not rendering**
- Check browser console for errors
- Verify data format matches chart type requirements
- Review ChartRenderer component for specific chart implementation

**LLM returns invalid JSON**
- LLMService.extractJSONFromResponse handles markdown code blocks
- Check console logs for parse errors
- May need to adjust prompt or retry logic

**Model not available error**
- Verify your API key has access to the selected model
- Check `/api/models` endpoint to see available models
- Some models require specific API tier (e.g., Opus requires higher tier)

**Streaming stops mid-response**
- Check browser console for SSE connection errors
- Verify API key has not hit rate limits
- Check server logs for LLM API errors
- Try refreshing the page to reset the EventSource connection
