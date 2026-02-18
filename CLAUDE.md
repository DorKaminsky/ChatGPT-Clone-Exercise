# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI-powered data visualization tool that combines natural language queries with automatic chart generation. Users upload Excel files, ask questions in plain English, and receive intelligent text responses with beautiful visualizations.

**Tech Stack:**
- Next.js 16 (App Router) with React 19 and TypeScript
- Claude 3.5 Sonnet for AI analysis via Anthropic SDK
- Material-UI 6 for UI components
- Recharts for data visualizations
- xlsx library for Excel file parsing
- Zod for runtime validation

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

1. **Query Analysis Phase** (lib/llm-service.ts:49)
   - LLM analyzes user question + data schema
   - Determines intent, required columns, filters, and aggregation type
   - Decides if visualization is needed
   - Returns structured JSON validated with Zod

2. **Response Generation Phase** (lib/llm-service.ts:73)
   - LLM processes filtered/aggregated data
   - Generates natural language answer
   - Selects appropriate chart type and data mapping
   - Returns text response + visualization spec

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
POST /api/chat (app/api/chat/route.ts)
  ↓
Phase 1: LLM analyzes query → determines data needs
  ↓
Phase 2: LLM processes data → generates response + viz spec
  ↓
ChartSpecGenerator transforms data for Recharts (lib/chart-spec-generator.ts)
  ↓
Frontend renders text + ChartRenderer component
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
- Currently uses `claude-3-5-sonnet-20241022` (line 34)
- Implements exponential backoff retry logic
- Extracts JSON from LLM responses (handles markdown code blocks)
- Temperature: 0.3 for consistent JSON output
- Max tokens: 4096

**ChartSpecGenerator (lib/chart-spec-generator.ts)**
- Transforms raw data into Recharts-compatible formats
- Handles data extraction with nested field support (dot notation)
- Converts string numbers to numeric values (removes $, commas)
- Supports bar, pie, line, scatter, and table visualizations

### API Endpoints

**POST /api/data/upload**
- Accepts `multipart/form-data` with Excel file
- Returns: `{ dataSourceId, fileName, schema, preview }`

**POST /api/chat**
- Accepts: `{ query: string, dataSourceId: string, conversationContext?: string[] }`
- Returns: `{ textResponse: string, visualization?: ChartData }`
- Implements aggregation logic for sum, count, average, groupby operations

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

### Aggregation Logic (app/api/chat/route.ts:134)
The chat endpoint implements four aggregation types:
- **groupby**: Groups by first column, sums second column
- **sum**: Same as groupby (legacy)
- **average**: Groups by first column, averages second column
- **count**: Counts occurrences per group
- **none**: Returns raw data

## File Structure

```
/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Main query processing endpoint
│   │   └── data/upload/route.ts       # File upload endpoint
│   ├── demo-charts/page.tsx           # Chart component demo page
│   ├── layout.tsx                     # Root layout with metadata
│   ├── page.tsx                       # Main application page
│   ├── theme.ts                       # Material-UI theme config
│   ├── ThemeProvider.tsx              # MUI theme provider wrapper
│   └── globals.css                    # Global styles
├── components/
│   ├── ChatInterface.tsx              # Chat UI with message list & input
│   ├── Message.tsx                    # Individual message display
│   ├── FileUpload.tsx                 # Drag-drop file upload
│   └── ChartRenderer.tsx              # Dynamic chart rendering
├── lib/
│   ├── types.ts                       # TypeScript type definitions
│   ├── data-service.ts                # Excel parsing & in-memory storage
│   ├── llm-service.ts                 # Claude API integration
│   ├── chart-spec-generator.ts        # Data transformation for charts
│   └── __tests__/
│       └── chart-spec-generator.test.ts  # Test suite for chart generator
├── public/
│   └── sample-sales-data.xlsx         # Sample data file (20 rows)
├── docs/                              # Legacy documentation (outdated)
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── next.config.ts                     # Next.js configuration
└── .env.local                         # Environment variables (git-ignored)
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

const llmService = new LLMService(); // Uses ANTHROPIC_API_KEY from env

// Phase 1: Analyze query
const analysis = await llmService.analyzeQuery(query, schema, preview);

// Phase 2: Generate response
const response = await llmService.generateResponse(query, data, schema);
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
2. **Single data source**: UI doesn't support multiple uploaded files
3. **No conversation history**: Each query is independent
4. **Basic aggregation**: Filter logic is simplified (line 59-65 in app/api/chat/route.ts)
5. **Model version**: Using Claude 3.5 Sonnet instead of Claude Opus 4.6 (original spec)

## Important Notes

- **Model Version**: The LLM service currently uses `claude-3-5-sonnet-20241022`. If you need to switch models, update `lib/llm-service.ts:34`
- **Data Limits**: The chat endpoint sends max 100 rows to LLM (line 74 in route.ts) to manage token usage
- **Excel Format**: Only first sheet is processed. Multi-sheet files will ignore additional sheets.
- **Type Inference**: Column types are inferred by sampling first 100 rows with 80% threshold
- **Hot Reload**: Data persists across Next.js hot reloads but not server restarts
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
