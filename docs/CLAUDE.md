# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChatGPT clone with data visualization capabilities. Users upload Excel files, ask natural language questions, and receive intelligent text responses with automatic visualizations (charts, graphs, tables).

**Key Requirements:**
- LLM: Claude Opus 4.6 (model: `claude-opus-4-6`)
- Data source: Excel files only (.xlsx)
- Dynamic visualization generation (bar, pie, line, scatter, table)
- No persistence required (in-memory storage is fine)

**Critical Grading Criteria:**
- UX quality (primary)
- Product thinking
- Code architecture
- Communication (ask clarifying questions)

## Working Directory Structure

```
/ChatGPT-Clone-Exercise/
├── CLAUDE.md                    # This file
├── SPEC.md                      # Detailed architecture and API specs
├── IMPLEMENTATION-TASKS.md      # Task breakdown and execution plan
└── chatgpt-clone/              # Next.js application (work here)
    ├── app/
    │   ├── api/                # Create API routes here
    │   ├── layout.tsx
    │   ├── page.tsx            # Main page (placeholder)
    │   └── globals.css
    ├── components/             # Create React components here
    ├── lib/
    │   └── types.ts            # TypeScript type definitions
    ├── public/
    │   └── sample-sales-data.xlsx
    └── package.json
```

**Important:** All development work happens in the `chatgpt-clone/` subdirectory, not the root.

## Commands

```bash
# Navigate to the application directory first
cd chatgpt-clone

# Development
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run Next.js linter
```

## Tech Stack (Already Configured)

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.9
- **Styling:** Tailwind CSS 4, Lucide icons
- **LLM:** @anthropic-ai/sdk (use Claude Opus 4.6)
- **Data:** xlsx library for Excel parsing
- **Visualization:** Recharts library
- **Validation:** Zod
- **Module System:** ESM (`"type": "module"` in package.json)

**Installed Versions (from package.json):**
```json
{
  "@anthropic-ai/sdk": "^0.74.0",
  "xlsx": "^0.18.5",
  "recharts": "^3.7.0",
  "zod": "^4.3.6",
  "next": "^16.1.6",
  "react": "^19.2.4",
  "tailwindcss": "^4.1.18"
}
```

## Architecture Overview

**Two-Phase LLM Approach:**
1. **Query Analysis:** LLM analyzes user question + data schema → determines intent, required columns, aggregation, visualization need
2. **Response Generation:** LLM processes filtered data → generates text response + chart specification

**Data Flow:**
1. User uploads Excel file → `/api/data/upload`
2. Backend parses file (xlsx), stores in-memory with UUID
3. User asks question → `/api/chat`
4. Backend: retrieve data → LLM Phase 1 → filter/aggregate → LLM Phase 2 → return text + chart spec
5. Frontend renders text + ChartRenderer component

**API Endpoints to Implement:**
- `POST /api/data/upload` - File upload and parsing
- `POST /api/chat` - Query processing and response generation

See `SPEC.md` for complete API contracts and `IMPLEMENTATION-TASKS.md` for detailed task breakdown.

## Key Implementation Files

**To Create:**
- `/app/api/data/upload/route.ts` - File upload endpoint
- `/app/api/chat/route.ts` - Chat query endpoint
- `/lib/data-service.ts` - Excel parsing and in-memory storage
- `/lib/llm-service.ts` - Claude API integration and prompt management
- `/lib/chart-spec-generator.ts` - Transform data for Recharts
- `/components/FileUpload.tsx` - Drag-drop upload UI
- `/components/ChatInterface.tsx` - Chat message list and input
- `/components/ChartRenderer.tsx` - Dynamic chart rendering (bar/pie/line/table)
- `/components/Message.tsx` - Individual message display

**Already Created:**
- `/lib/types.ts` - Complete TypeScript interfaces for all data structures, API contracts, chart specs (95 lines, all types defined)
- `/app/layout.tsx` - Basic root layout with metadata
- `/app/page.tsx` - Placeholder main page
- `/public/sample-sales-data.xlsx` - Sample data file with 20 rows (Date, Product, Region, Quantity, Revenue)

## Environment Variables

Create `chatgpt-clone/.env.local`:
```bash
ANTHROPIC_API_KEY=your_api_key_here
```

**Never commit this file.** It's already in `.gitignore`. A `.env.example` exists as a template.

**Accessing in API Routes:**
```typescript
// process.env.ANTHROPIC_API_KEY is available in server-side code
// Next.js automatically loads .env.local in development and production
```

## LLM Integration

Use Claude Opus 4.6 via Anthropic SDK:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await client.messages.create({
  model: 'claude-opus-4-6',  // Required model
  max_tokens: 1024,
  messages: [{ role: 'user', content: promptTemplate }],
});

// Extract text from response
const textContent = response.content.find(block => block.type === 'text');
const responseText = textContent?.text || '';
```

**Prompt Strategy:** Include data schema, sample rows, and user query. Request JSON responses for structured output (use Zod for validation).

**JSON Parsing Pattern:**
```typescript
// Always handle malformed JSON
try {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    const validated = YourZodSchema.parse(parsed);
    return validated;
  }
} catch (error) {
  // Fallback or retry logic
}
```

## Excel File Handling

**Parse Excel with xlsx library:**
```typescript
import * as XLSX from 'xlsx';

// In API route or service
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0]; // Use first sheet
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// data is array of objects: [{ Date: '2024-01-15', Product: 'Widget A', ... }]
```

**Infer Column Types:**
```typescript
// Sample first few values to detect type
const sampleValue = data[0][columnName];
if (typeof sampleValue === 'number') return 'number';
if (sampleValue instanceof Date) return 'date';
if (typeof sampleValue === 'boolean') return 'boolean';
return 'string'; // default
```

**In-Memory Storage Pattern:**
```typescript
// Simple Map for prototype (no database needed)
const dataStore = new Map<string, ParsedData>();

function storeData(parsedData: ParsedData): string {
  const id = crypto.randomUUID();
  dataStore.set(id, parsedData);
  return id;
}

function getData(id: string): ParsedData | undefined {
  return dataStore.get(id);
}
```

## Chart Type Decision Matrix

| Query Type | Chart Type | Example |
|------------|------------|---------|
| Compare categories | Bar chart | "Which product sold most?" |
| Show proportions | Pie chart | "Sales % by region?" |
| Trends over time | Line chart | "Revenue trend?" |
| Relationships | Scatter | "Price vs quantity?" |
| Raw filtered data | Table | "Orders over $1000" |

## Development Workflow

**Phase 1 (Parallel):** Four independent workstreams can be developed simultaneously:
- Workstream A: File upload + Excel parsing (data-service.ts, FileUpload.tsx, /api/data/upload)
- Workstream B: LLM integration (llm-service.ts, prompt engineering)
- Workstream C: Chat UI (ChatInterface.tsx, Message.tsx, page.tsx)
- Workstream D: Visualization (ChartRenderer.tsx, chart-spec-generator.ts)

**Phase 2 (Sequential):** Integration - connect all components via /api/chat endpoint, state management, error handling

See `IMPLEMENTATION-TASKS.md` for detailed tasks and acceptance criteria.

## Important Notes

- **UX is paramount:** Loading states, clear errors, intuitive flow, mobile-responsive (this is the primary grading criterion)
- **Product thinking:** Add example query suggestions, explain chart choices, handle edge cases gracefully
- **Scope discipline:** One data source (Excel), no persistence, no auth, no chat history
- **ESM syntax:** Use `import/export`, not `require()` (package.json has `"type": "module"`)
- **Next.js App Router:** Use `route.ts` for API routes, server components by default, client components need `'use client'` directive
- **Error handling:** Validate file types, handle LLM failures, show user-friendly messages
- **Sample data:** Use `/public/sample-sales-data.xlsx` for testing and demos

## Next.js App Router Patterns

**API Route Example:**
```typescript
// app/api/data/upload/route.ts
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Process file...

    return Response.json({ dataSourceId, fileName, schema, preview });
  } catch (error) {
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

**Client Component Pattern:**
```typescript
'use client'  // Required for useState, useEffect, event handlers

import { useState } from 'react'

export default function MyComponent() {
  const [state, setState] = useState(null)
  // ...
}
```

## Current Implementation Status

**Phase 0: Setup** ✅ Complete
- Project scaffolding, dependencies installed, folder structure created
- Only skeleton files exist: `app/layout.tsx`, `app/page.tsx`, `lib/types.ts`
- Sample data at `/public/sample-sales-data.xlsx` (20 rows, 5 columns)

**Phase 1: Parallel Development** ⏳ Not Started
- No API routes implemented yet (`/api/data/upload`, `/api/chat`)
- No components created yet (FileUpload, ChatInterface, ChartRenderer, Message)
- No services implemented yet (data-service, llm-service, chart-spec-generator)

See `PHASE0-COMPLETE.md` and `IMPLEMENTATION-TASKS.md` for detailed status and next steps.

## Common Pitfalls

- Don't work in the root directory - always `cd chatgpt-clone` first
- Don't forget to validate ANTHROPIC_API_KEY is set in `.env.local`
- Next.js API routes must be named `route.ts`, not `index.ts` or `[name].ts`
- API routes live in `app/api/*/route.ts` (e.g., `app/api/data/upload/route.ts`)
- Recharts requires specific data formats per chart type (see chart-spec-generator.ts responsibility)
- LLM responses may not always be valid JSON - implement parsing error handling
- Tailwind CSS v4 uses new `@tailwindcss/postcss` plugin (not `@tailwindcss/jit`)
- File uploads in Next.js App Router: use `await request.formData()` to parse multipart forms