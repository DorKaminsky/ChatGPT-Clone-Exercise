# ChatGPT Clone with Data Visualization - Full Specification

## 1. Executive Summary

**Product:** ChatGPT-style interface that allows users to query connected data sources and receive intelligent text responses with automatic data visualizations.

**Core Value Proposition:** Users can ask natural language questions about their data and get instant insights through both text explanations and visual charts, without needing to know SQL, Python, or data analysis tools.

**Timeline:** 4 hours with aggressive AI agent usage

**Tech Constraint:** Claude Sonnet 4.5 available for development, Claude Opus 4.6 required for production LLM

---

## 2. Product Requirements

### 2.1 Must Have (P0)
1. **Data Source Connection**
   - User can upload/connect to ONE data source type (Excel recommended)
   - System validates and parses the data
   - User sees confirmation of successful connection

2. **Natural Language Query Interface**
   - Chat-style text input interface
   - Send query to Claude Opus 4.6
   - Display streaming or complete text responses

3. **Automatic Visualization Generation**
   - System automatically determines when visualization is appropriate
   - System selects appropriate chart type (pie, bar, line, scatter, table)
   - Chart renders inline with text response
   - Minimum 3 chart types supported

4. **Basic Error Handling**
   - Invalid queries get helpful error messages
   - Data parsing errors are communicated clearly
   - LLM API failures are handled gracefully

### 2.2 Should Have (P1)
1. Multiple chart types (5+ types)
2. Download chart as image
3. Sample data pre-loaded for demo purposes
4. Mobile-responsive design
5. Loading states and visual feedback

### 2.3 Won't Have (Out of Scope)
- Chat history persistence
- Multiple conversations
- User authentication
- Multiple data sources in one session
- Real-time collaboration
- Data editing capabilities

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Chat UI      │  │ File Upload  │  │ Chart Renderer  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────┴───────────────────────────────────┐
│                      Backend (API Layer)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Chat Handler │  │ File Handler │  │ Query Processor │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                  │                    │           │
│  ┌──────┴──────────────────┴────────────────────┴────────┐ │
│  │           LLM Orchestration Service                    │ │
│  │  (Claude Opus 4.6 Integration + Prompt Management)    │ │
│  └──────┬──────────────────┬──────────────────┬──────────┘ │
│         │                  │                   │            │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌────────┴─────────┐ │
│  │ Data Service │  │ Analysis Svc │  │ Chart Spec Gen   │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Recommended Tech Stack

**Frontend:**
- Framework: Next.js 14+ (App Router) - provides frontend + API routes in one
- Styling: Tailwind CSS
- Charts: Recharts (React-friendly, simple API)
- State: React hooks + Context (no Redux needed for this scope)

**Backend:**
- Runtime: Node.js with Next.js API routes
- LLM: Anthropic SDK (@anthropic-ai/sdk)
- Data Parsing: xlsx (for Excel files)
- Validation: Zod

**Alternative Stack (if Python preferred):**
- Frontend: React + Vite
- Backend: FastAPI
- LLM: Anthropic Python SDK
- Data: pandas + openpyxl

### 3.3 Data Flow

**Query Processing Flow:**
```
1. User types question → Frontend
2. POST /api/chat with { query, dataSourceId }
3. Backend retrieves data source metadata
4. LLM Call #1: Analyze query + data schema → determine intent
5. Extract relevant data based on LLM instructions
6. LLM Call #2: Analyze results → generate answer + chart spec
7. Return { textResponse, chartSpec?, chartData? }
8. Frontend renders text + chart
```

**File Upload Flow:**
```
1. User uploads file → Frontend
2. POST /api/data/upload with file
3. Backend parses file (xlsx → JSON)
4. Store in memory with unique ID
5. Analyze schema (columns, types, sample rows)
6. Return { dataSourceId, schema, preview }
7. Frontend shows "Connected to: filename.xlsx"
```

---

## 4. API Contracts

### 4.1 POST /api/data/upload

**Request:**
```typescript
Content-Type: multipart/form-data
Body: {
  file: File // Excel file
}
```

**Response:**
```typescript
{
  dataSourceId: string,
  fileName: string,
  schema: {
    columns: Array<{
      name: string,
      type: 'string' | 'number' | 'date' | 'boolean',
      sample: any[]
    }>,
    rowCount: number
  },
  preview: any[] // First 5 rows
}
```

### 4.2 POST /api/chat

**Request:**
```typescript
{
  query: string,
  dataSourceId: string,
  conversationContext?: string[] // Optional for multi-turn
}
```

**Response:**
```typescript
{
  textResponse: string,
  visualization?: {
    type: 'bar' | 'pie' | 'line' | 'scatter' | 'table',
    data: any[], // Format depends on chart type
    config: {
      xAxis?: string,
      yAxis?: string,
      title?: string,
      labels?: string[]
    }
  },
  error?: string
}
```

---

## 5. LLM Orchestration Strategy

### 5.1 Two-Phase Approach

**Phase 1: Query Understanding & Data Extraction**

Prompt Template:
```
You are a data analyst assistant. The user has uploaded a dataset with the following schema:
{SCHEMA}

Sample data:
{SAMPLE_ROWS}

User question: "{USER_QUERY}"

Task: Analyze this question and provide a JSON response with:
1. "intent": What is the user trying to find out?
2. "dataNeeded": Which columns and filters are needed?
3. "aggregation": What calculations are needed (sum, count, average, etc.)?
4. "needsVisualization": true/false

Return only valid JSON.
```

**Phase 2: Answer Generation & Visualization**

Prompt Template:
```
You analyzed a user's question and retrieved this data:
{FILTERED_DATA}

Original question: "{USER_QUERY}"

Task: Provide a JSON response with:
1. "answer": Natural language explanation (2-3 sentences)
2. "visualization": If appropriate, specify:
   - "type": "bar" | "pie" | "line" | "scatter" | "table"
   - "reason": Why this chart type?
   - "dataMapping": { xAxis: "column", yAxis: "column", ... }

Return only valid JSON.
```

### 5.2 Chart Type Decision Matrix

| User Intent | Best Chart Type | Example Query |
|-------------|-----------------|---------------|
| Compare categories | Bar chart | "Which product sold the most?" |
| Show proportions | Pie chart | "What percentage of sales by region?" |
| Trends over time | Line chart | "How did revenue change monthly?" |
| Relationship between variables | Scatter | "Correlation between price and quantity?" |
| Show raw filtered data | Table | "Show all orders over $1000" |

---

## 6. Component Specifications

### 6.1 Frontend Components

**ChatInterface.tsx**
- Text input with send button
- Message list (user messages + AI responses)
- Loading state during LLM processing
- Error display

**FileUpload.tsx**
- Drag-and-drop or click to upload
- File type validation (.xlsx, .xls)
- Upload progress indicator
- Success state with file info display

**ChartRenderer.tsx**
- Takes visualization spec as props
- Renders appropriate chart using Recharts
- Handles different chart types dynamically
- Responsive sizing
- Download button (P1)

**DataSourceInfo.tsx**
- Shows connected file name
- Displays schema summary
- Shows data preview (first few rows)
- Disconnect/upload new file button

### 6.2 Backend Services

**LLMService**
```typescript
class LLMService {
  async analyzeQuery(query: string, schema: Schema): Promise<QueryAnalysis>
  async generateResponse(query: string, data: any[]): Promise<Response>
  // Handles Anthropic API calls, retries, error handling
}
```

**DataService**
```typescript
class DataService {
  async parseExcelFile(file: Buffer): Promise<ParsedData>
  async getDataById(id: string): Promise<ParsedData>
  async queryData(id: string, filters: Filter[]): Promise<any[]>
  // In-memory storage for prototype (Map<string, ParsedData>)
}
```

**ChartSpecGenerator**
```typescript
class ChartSpecGenerator {
  generateSpec(type: ChartType, data: any[], mapping: DataMapping): ChartSpec
  // Transforms raw data into Recharts-compatible format
}
```

---

## 7. Implementation Plan - Parallel Workstreams

### Phase 0: Setup (Sequential - 15 mins)
- [ ] Initialize Next.js project with TypeScript
- [ ] Install dependencies (Anthropic SDK, xlsx, Recharts, Tailwind)
- [ ] Create project structure
- [ ] Set up environment variables (.env.local)

### Phase 1: Parallel Development (Can be done by separate agents)

**Workstream A: File Upload & Data Parsing (45 mins)**
- [ ] Build file upload API endpoint
- [ ] Implement Excel parsing with xlsx
- [ ] Create in-memory data store
- [ ] Build FileUpload component
- [ ] Test with sample Excel file

**Workstream B: LLM Integration (60 mins)**
- [ ] Set up Anthropic SDK with Opus 4.6
- [ ] Create LLMService class
- [ ] Implement query analysis prompts
- [ ] Implement response generation prompts
- [ ] Test with mock data
- [ ] Add streaming support (P1)

**Workstream C: Chat UI (45 mins)**
- [ ] Build ChatInterface component
- [ ] Implement message list with styling
- [ ] Add loading states
- [ ] Create chat API endpoint
- [ ] Connect frontend to backend

**Workstream D: Visualization Engine (60 mins)**
- [ ] Set up Recharts
- [ ] Build ChartRenderer component
- [ ] Implement bar chart type
- [ ] Implement pie chart type
- [ ] Implement line chart type
- [ ] Implement table view
- [ ] Create ChartSpecGenerator service

### Phase 2: Integration (Sequential - 45 mins)
- [ ] Connect all components
- [ ] End-to-end testing
- [ ] Error handling polish
- [ ] Add sample data for demo
- [ ] UX improvements (loading states, animations)

### Phase 3: Polish (30 mins)
- [ ] Mobile responsive adjustments
- [ ] Error message improvements
- [ ] Add example queries UI
- [ ] Performance testing
- [ ] Create demo video

---

## 8. Sample Data Structure

**Example Excel File (sales_data.xlsx):**
```
| Date       | Product      | Region | Quantity | Revenue |
|------------|--------------|--------|----------|---------|
| 2024-01-15 | Widget A     | North  | 100      | 5000    |
| 2024-01-16 | Widget B     | South  | 150      | 7500    |
| 2024-01-17 | Widget A     | East   | 200      | 10000   |
| 2024-01-18 | Gadget X     | West   | 75       | 6000    |
| 2024-01-19 | Gadget Y     | North  | 120      | 8400    |
```

**Sample Queries:**
1. "Which product generated the most revenue?"
2. "Show me sales by region as a pie chart"
3. "What's the trend of quantity sold over time?"
4. "Show all orders with revenue over $7000"

---

## 9. Success Criteria

### Technical
- [ ] Successfully upload and parse Excel file
- [ ] Query returns relevant text response within 3 seconds
- [ ] Visualizations render correctly for 3+ chart types
- [ ] No crashes on invalid queries
- [ ] Works on latest Chrome, Safari, Firefox

### UX (Critical for grading)
- [ ] Intuitive first-time experience
- [ ] Clear visual feedback for all actions
- [ ] Helpful error messages
- [ ] Professional, modern design
- [ ] Smooth interactions (no jarring transitions)

### Product Thinking (Critical for grading)
- [ ] Solves real user need elegantly
- [ ] Thoughtful default behaviors
- [ ] Anticipates user questions with examples
- [ ] Handles edge cases gracefully

---

## 10. Development Guidelines

### Code Organization (Next.js structure)
```
/app
  /api
    /chat/route.ts
    /data
      /upload/route.ts
  /page.tsx (main chat interface)
/components
  /ChatInterface.tsx
  /FileUpload.tsx
  /ChartRenderer.tsx
  /Message.tsx
/lib
  /llm-service.ts
  /data-service.ts
  /chart-spec-generator.ts
  /types.ts
/public
  /sample-data.xlsx
```

### Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=development
```

### Testing Strategy
- Manual testing with 5-10 diverse queries
- Test with different Excel file structures
- Test error cases (no file, invalid query, API failure)
- Browser testing (Chrome, Safari)
- Mobile responsiveness check

---

## 11. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM doesn't understand query | High | Provide clear schema context in prompts; test with diverse queries |
| Chart type selection wrong | Medium | Use clear decision matrix; allow LLM to explain choice |
| Excel parsing fails | High | Validate file format; provide clear error messages |
| API rate limits hit | Medium | Implement caching for repeated queries; add retry logic |
| UX feels clunky | High | Test frequently; prioritize loading states and feedback |

---

## 12. Demo Script (for Loom video)

1. **Introduction** (30 sec)
   - "Built a ChatGPT clone that analyzes data and creates visualizations"
   - Show the clean interface

2. **Feature Demo** (90 sec)
   - Upload sample Excel file
   - Ask "Which product sold the most?" → Show text + bar chart
   - Ask "Show revenue by region" → Show pie chart
   - Ask "What's the trend?" → Show line chart

3. **Technical Overview** (60 sec)
   - Explain architecture (Next.js + Claude Opus 4.6)
   - Show two-phase LLM approach
   - Mention parallel development with AI agents

4. **Product Decisions** (30 sec)
   - Why Excel (simplicity, common use case)
   - Why automatic chart selection (reduces user friction)
   - Focus on UX over feature count

---

## 13. Questions to Consider

**For Product Manager / User:**
1. Should the system support multiple sheets within one Excel file?
2. What happens if the dataset is very large (>10,000 rows)?
3. Should users be able to refine visualizations (change chart type, colors)?
4. Do you want example queries shown in the UI to guide users?
5. Should the system explain why it chose a particular visualization?

**Architectural:**
1. In-memory storage OK, or need file system persistence?
2. Should we cache LLM responses for identical queries?
3. Maximum file size limit?

---

## Appendix A: Quick Start Commands

```bash
# Create Next.js project
npx create-next-app@latest chatgpt-clone --typescript --tailwind --app

# Install dependencies
npm install @anthropic-ai/sdk xlsx recharts

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Appendix B: Anthropic API Example

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Your prompt here' }],
});
```
