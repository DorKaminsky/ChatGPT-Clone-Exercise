# Implementation Task Breakdown

This document breaks the project into parallelizable workstreams that can be executed simultaneously by multiple agents or developers.

---

## 🎯 Execution Strategy

**Total Time Estimate:** 3-4 hours with parallel execution
**Agent Model:** Claude Sonnet 4.5 (unlimited usage)
**Parallel Execution:** 4 workstreams can run simultaneously

---

## Phase 0: Project Setup (MUST BE DONE FIRST - Sequential)

⏱️ **Time:** 15 minutes
🔗 **Dependencies:** None
👤 **Agent:** Setup Agent

### Tasks:
- [ ] Initialize Next.js project with TypeScript, Tailwind, App Router
  ```bash
  npx create-next-app@latest chatgpt-clone --typescript --tailwind --app
  ```
- [ ] Install core dependencies:
  ```bash
  npm install @anthropic-ai/sdk xlsx recharts zod lucide-react
  ```
- [ ] Create folder structure:
  ```
  /app/api/chat/route.ts
  /app/api/data/upload/route.ts
  /components/ChatInterface.tsx
  /components/FileUpload.tsx
  /components/ChartRenderer.tsx
  /lib/llm-service.ts
  /lib/data-service.ts
  /lib/chart-spec-generator.ts
  /lib/types.ts
  ```
- [ ] Create `.env.local` with `ANTHROPIC_API_KEY`
- [ ] Create sample Excel file in `/public/sample-data.xlsx`
- [ ] Update CLAUDE.md with setup completion and tech stack used

**Acceptance Criteria:**
- `npm run dev` starts successfully
- All folders created
- Dependencies installed without errors

**Deliverable:** Working Next.js skeleton with dependencies

---

## Phase 1: Parallel Development (4 Simultaneous Workstreams)

### 🟦 WORKSTREAM A: Data Upload & Parsing

⏱️ **Time:** 45-60 minutes
🔗 **Dependencies:** Phase 0 complete
👤 **Agent:** Data Agent
📁 **Files:**
- `/app/api/data/upload/route.ts`
- `/lib/data-service.ts`
- `/components/FileUpload.tsx`
- `/lib/types.ts` (DataSource interfaces)

#### A1: Backend - File Upload API
- [ ] Create POST `/api/data/upload` endpoint
- [ ] Use `formidable` or Next.js native to handle file upload
- [ ] Validate file type (.xlsx, .xls only)
- [ ] Return error for invalid files

#### A2: Backend - Excel Parser
- [ ] Create `DataService` class in `/lib/data-service.ts`
- [ ] Implement `parseExcelFile(buffer: Buffer)` using `xlsx` library
- [ ] Extract columns, types (string/number/date detection)
- [ ] Get row count and first 5 rows for preview
- [ ] Store parsed data in-memory Map (key: uuid, value: ParsedData)

#### A3: Frontend - File Upload Component
- [ ] Create `FileUpload.tsx` with drag-and-drop zone
- [ ] Add file input with click to upload
- [ ] Show upload progress/loading state
- [ ] Display success state with file info (name, rows, columns)
- [ ] Show data preview table (first 5 rows)
- [ ] Add "Upload New File" button to reset

#### A4: Testing
- [ ] Create test Excel file with 20+ rows, multiple column types
- [ ] Test upload flow end-to-end
- [ ] Test error cases (wrong file type, corrupted file)

**Acceptance Criteria:**
- User can drag/drop Excel file
- Backend parses file and returns schema + preview
- Frontend displays file info and preview
- Invalid files show clear error messages

**API Contract:**
```typescript
// POST /api/data/upload
Response: {
  dataSourceId: string,
  fileName: string,
  schema: { columns: Column[], rowCount: number },
  preview: any[]
}
```

---

### 🟩 WORKSTREAM B: LLM Integration & Orchestration

⏱️ **Time:** 60-75 minutes
🔗 **Dependencies:** Phase 0 complete
👤 **Agent:** LLM Agent
📁 **Files:**
- `/lib/llm-service.ts`
- `/lib/types.ts` (LLM interfaces)
- `/app/api/chat/route.ts` (partial)

#### B1: LLM Service Setup
- [ ] Create `LLMService` class in `/lib/llm-service.ts`
- [ ] Initialize Anthropic client with API key
- [ ] Set model to `claude-opus-4-6`
- [ ] Add error handling and retries

#### B2: Phase 1 Prompt - Query Analysis
- [ ] Create `analyzeQuery()` method
- [ ] Design prompt template that includes:
  - Data schema
  - Sample rows
  - User query
- [ ] Prompt returns JSON with:
  ```typescript
  {
    intent: string,
    dataNeeded: { columns: string[], filters?: any },
    aggregation?: 'sum' | 'count' | 'average' | 'groupby',
    needsVisualization: boolean
  }
  ```
- [ ] Parse LLM response and validate JSON
- [ ] Handle malformed JSON responses

#### B3: Phase 2 Prompt - Response Generation
- [ ] Create `generateResponse()` method
- [ ] Design prompt template that includes:
  - User query
  - Filtered/aggregated data
- [ ] Prompt returns JSON with:
  ```typescript
  {
    answer: string,
    visualization?: {
      type: 'bar' | 'pie' | 'line' | 'scatter' | 'table',
      reason: string,
      dataMapping: { xAxis?: string, yAxis?: string, ... }
    }
  }
  ```
- [ ] Implement retry logic for API failures

#### B4: Testing
- [ ] Test with mock data schema
- [ ] Test 5+ different query types:
  - Comparison: "Which product sold most?"
  - Proportion: "Sales percentage by region"
  - Trend: "Revenue over time"
  - Filter: "Orders above $1000"
  - Aggregation: "Average sales per region"
- [ ] Verify JSON parsing works correctly
- [ ] Test error cases (API timeout, invalid response)

**Acceptance Criteria:**
- LLM correctly interprets diverse query types
- Returns valid, parseable JSON responses
- Handles errors gracefully
- Phase 1 and Phase 2 prompts work end-to-end

**Interface:**
```typescript
class LLMService {
  async analyzeQuery(query: string, schema: Schema): Promise<QueryAnalysis>
  async generateResponse(query: string, data: any[]): Promise<AIResponse>
}
```

---

### 🟨 WORKSTREAM C: Chat Interface & User Experience

⏱️ **Time:** 45-60 minutes
🔗 **Dependencies:** Phase 0 complete
👤 **Agent:** Frontend Agent
📁 **Files:**
- `/app/page.tsx`
- `/components/ChatInterface.tsx`
- `/components/Message.tsx`
- `/components/DataSourceInfo.tsx`

#### C1: Chat Interface Component
- [ ] Create `ChatInterface.tsx` with:
  - Message list (scrollable, auto-scroll to bottom)
  - Text input with send button
  - Enter to send, Shift+Enter for new line
  - Disable input when loading
- [ ] Style messages (user right-aligned, AI left-aligned)
- [ ] Add loading indicator during LLM processing

#### C2: Message Component
- [ ] Create `Message.tsx` to display individual messages
- [ ] User messages: simple text bubbles
- [ ] AI messages: text + optional chart placeholder
- [ ] Add timestamp to messages
- [ ] Markdown rendering for AI responses (bold, lists, etc.)

#### C3: Data Source Info Component
- [ ] Create `DataSourceInfo.tsx` to show:
  - Connected file name
  - Row/column count
  - "Upload New File" button
- [ ] Display when data is connected
- [ ] Sticky position at top

#### C4: Main Page Layout
- [ ] Update `/app/page.tsx` with overall layout:
  - Header with title
  - File upload section (initially visible)
  - Chat interface (visible after upload)
  - Responsive design (mobile-friendly)
- [ ] Add example queries as suggestions (clickable chips)
- [ ] Add empty state (no file uploaded yet)

#### C5: Styling & UX Polish
- [ ] Use Tailwind for consistent styling
- [ ] Add smooth transitions
- [ ] Loading states with spinners
- [ ] Error message displays (red, dismissible)
- [ ] Make it visually appealing (use color, spacing)

**Acceptance Criteria:**
- Chat interface is intuitive and responsive
- Messages display correctly with timestamps
- Loading states are clear
- Works on mobile and desktop
- Professional, modern design

---

### 🟪 WORKSTREAM D: Visualization Engine

⏱️ **Time:** 60-75 minutes
🔗 **Dependencies:** Phase 0 complete
👤 **Agent:** Visualization Agent
📁 **Files:**
- `/components/ChartRenderer.tsx`
- `/lib/chart-spec-generator.ts`
- `/lib/types.ts` (Chart interfaces)

#### D1: Chart Spec Generator Service
- [ ] Create `ChartSpecGenerator` class
- [ ] Implement `generateSpec()` method that transforms:
  ```typescript
  Input: { type: ChartType, data: any[], mapping: DataMapping }
  Output: { type, data: RechartsFormat, config }
  ```
- [ ] Create transformation logic for each chart type:
  - **Bar Chart:** Array of `{ name: string, value: number }`
  - **Pie Chart:** Array of `{ name: string, value: number }`
  - **Line Chart:** Array of `{ x: string|number, y: number }`
  - **Table:** Array of objects (passthrough)

#### D2: ChartRenderer Component - Bar Charts
- [ ] Import `BarChart` from Recharts
- [ ] Create props interface for `ChartRenderer`
- [ ] Render bar chart with:
  - Responsive container
  - XAxis and YAxis
  - Tooltip
  - Legend
  - Custom colors

#### D3: ChartRenderer Component - Pie Charts
- [ ] Import `PieChart` from Recharts
- [ ] Render pie chart with:
  - Labels showing percentages
  - Legend
  - Custom colors
  - Tooltip

#### D4: ChartRenderer Component - Line Charts
- [ ] Import `LineChart` from Recharts
- [ ] Render line chart with:
  - XAxis and YAxis
  - Grid lines
  - Tooltip
  - Smooth curves

#### D5: ChartRenderer Component - Table View
- [ ] Create simple table renderer (not Recharts)
- [ ] Styled table with:
  - Header row
  - Alternating row colors
  - Responsive (horizontal scroll on mobile)

#### D6: Dynamic Chart Routing
- [ ] Add switch/case in `ChartRenderer` to route to correct chart type
- [ ] Handle invalid chart types gracefully
- [ ] Add loading state while chart prepares
- [ ] Add download button (P1 - optional)

#### D7: Testing
- [ ] Test each chart type with sample data
- [ ] Verify responsive behavior
- [ ] Test with edge cases (empty data, single data point)
- [ ] Visual QA on different screen sizes

**Acceptance Criteria:**
- All 4 chart types render correctly
- Charts are responsive and visually appealing
- Handles edge cases without crashing
- Clear labels and tooltips

**Interface:**
```typescript
<ChartRenderer
  type="bar" | "pie" | "line" | "table"
  data={any[]}
  config={{ title?, xAxis?, yAxis? }}
/>
```

---

## Phase 2: Integration & End-to-End Testing (Sequential)

⏱️ **Time:** 45-60 minutes
🔗 **Dependencies:** All Phase 1 workstreams complete
👤 **Agent:** Integration Agent

### Tasks:

#### I1: Complete Chat API Endpoint
- [ ] Finish `/app/api/chat/route.ts` to orchestrate:
  1. Receive query + dataSourceId
  2. Retrieve data from DataService
  3. Call LLMService.analyzeQuery()
  4. Filter/aggregate data based on analysis
  5. Call LLMService.generateResponse()
  6. If visualization needed, call ChartSpecGenerator
  7. Return complete response

#### I2: Connect Frontend to Backend
- [ ] Add API call in ChatInterface to POST /api/chat
- [ ] Pass dataSourceId from FileUpload to ChatInterface
- [ ] Handle response and update message list
- [ ] Render chart using ChartRenderer

#### I3: State Management
- [ ] Manage dataSourceId in app state (Context or useState)
- [ ] Pass between FileUpload and ChatInterface
- [ ] Handle "Upload New File" (reset state)

#### I4: Error Handling
- [ ] Display API errors in chat interface
- [ ] Handle LLM failures gracefully
- [ ] Handle chart rendering errors
- [ ] Add error boundaries (React)

#### I5: End-to-End Testing
- [ ] Test complete flow:
  1. Upload file
  2. Ask query
  3. Receive text + chart
  4. Ask follow-up query
- [ ] Test with 10+ diverse queries
- [ ] Test error scenarios
- [ ] Test on different browsers

**Acceptance Criteria:**
- Complete flow works without manual intervention
- All components communicate correctly
- Errors are handled and displayed
- Performance is acceptable (<3s per query)

---

## Phase 3: Polish & Demo Preparation (Sequential)

⏱️ **Time:** 30 minutes
🔗 **Dependencies:** Phase 2 complete
👤 **Agent:** Polish Agent

### Tasks:

#### P1: UX Improvements
- [ ] Add example query chips (clickable)
- [ ] Add loading animations
- [ ] Polish error messages (user-friendly)
- [ ] Add success feedback (file uploaded, etc.)
- [ ] Improve mobile responsiveness

#### P2: Demo Preparation
- [ ] Create compelling sample data file
- [ ] Test with queries that showcase features
- [ ] Prepare 3-4 "wow" queries for demo
- [ ] Take screenshots for documentation

#### P3: Performance & Optimization
- [ ] Check for unnecessary re-renders
- [ ] Optimize chart rendering
- [ ] Test with larger datasets (500+ rows)
- [ ] Add loading states everywhere needed

#### P4: Documentation
- [ ] Update README.md with:
  - Setup instructions
  - How to run
  - Features implemented
  - Architecture overview
- [ ] Add comments to complex code sections
- [ ] Create demo script for Loom video

**Acceptance Criteria:**
- App feels polished and professional
- Demo-ready with sample data
- Documentation is clear
- Ready for video recording

---

## 🚀 Execution Order

### Recommended Execution:

1. **Single agent does Phase 0** (15 min)
2. **Four agents do Phase 1 in parallel:** (60-75 min)
   - Agent A: Data Upload & Parsing
   - Agent B: LLM Integration
   - Agent C: Chat Interface
   - Agent D: Visualization Engine
3. **Single agent does Phase 2** (45-60 min)
4. **Single agent does Phase 3** (30 min)

**Total Time:** ~2.5-3.5 hours with parallel execution

---

## 📋 Quality Checklist

Before considering the project complete:

### Functionality
- [ ] File upload works with .xlsx files
- [ ] At least 5 different query types work correctly
- [ ] Text responses are relevant and accurate
- [ ] Visualizations render correctly
- [ ] At least 3 chart types implemented

### UX (Critical for grading)
- [ ] First-time user can figure out how to use it
- [ ] Loading states are clear
- [ ] Errors are helpful, not cryptic
- [ ] Design is professional and modern
- [ ] Mobile responsive

### Code Quality
- [ ] TypeScript types are defined
- [ ] No console errors
- [ ] Code is organized and readable
- [ ] Environment variables used correctly

### Demo Readiness
- [ ] Sample data showcases features well
- [ ] 3-4 impressive queries prepared
- [ ] App doesn't crash during demo
- [ ] Screenshots/video prepared

---

## 🎬 Demo Video Script (3 minutes)

### Part 1: Introduction (30 sec)
- Show landing page
- "I built a ChatGPT clone that turns data questions into visualizations"
- Show clean, professional UI

### Part 2: Demo (90 sec)
- Upload sample file (sales data)
- Query 1: "Which product generated the most revenue?" → Bar chart
- Query 2: "Show me the sales distribution by region" → Pie chart
- Query 3: "How did quantity sold trend over time?" → Line chart
- Query 4: "Show all high-value orders" → Table

### Part 3: Technical Overview (45 sec)
- Show architecture diagram from SPEC.md
- "Built with Next.js, Claude Opus 4.6, and Recharts"
- "Two-phase LLM approach: analyze then visualize"
- "Developed in parallel using 4 AI coding agents"

### Part 4: Product Decisions (15 sec)
- "Chose Excel for simplicity and ubiquity"
- "Automatic chart selection reduces friction"
- "Focused on UX over feature count"

---

## 📞 Questions to Ask if Blocked

If any agent gets stuck, pause and ask:

1. **Data Source:**
   - Should we support multiple Excel sheets?
   - Maximum file size limit?

2. **LLM Behavior:**
   - What if LLM returns unclear chart recommendation?
   - Should we explain why a chart type was chosen?

3. **UX:**
   - Show example queries in the UI?
   - Allow manual chart type override?

4. **Scope:**
   - Is chat history important (contradicts requirements)?
   - Should visualizations be downloadable?

---

## 🎯 Success Metrics

The project is successful if:

1. **Functional:** All P0 features work reliably
2. **UX:** A first-time user can complete a query without instructions
3. **Impressive:** Demo generates "wow" reactions
4. **Professional:** Code and UI look production-ready
5. **Communicative:** Asks clarifying questions when appropriate

**Remember:** Grading heavily weighs UX and product thinking, not just technical implementation!
