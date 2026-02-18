# Technical Architecture Explanation

This document provides a comprehensive technical explanation of how the ChatGPT Clone with Data Visualization works, covering both client and server components.

---

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Client-Side (Frontend)](#client-side-frontend)
4. [Server-Side (Backend)](#server-side-backend)
5. [Data Flow](#data-flow)
6. [Two-Phase LLM Approach](#two-phase-llm-approach)
7. [Model Selection System](#model-selection-system)
8. [Visualization System](#visualization-system)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Components (Client-Side)                      │   │
│  │  - FileUpload.tsx                                    │   │
│  │  - ChatInterface.tsx                                 │   │
│  │  - ModelSelector.tsx                                 │   │
│  │  - ChartRenderer.tsx                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Routes (Server-Side)                            │   │
│  │  - /api/data/upload    (POST)                        │   │
│  │  - /api/chat           (POST)                        │   │
│  │  - /api/models         (GET)                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Business Logic Services                             │   │
│  │  - data-service.ts     (Excel parsing & storage)     │   │
│  │  - llm-service.ts      (Claude API integration)      │   │
│  │  - chart-spec-generator.ts (Chart data transform)    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  In-Memory Storage (globalThis)                      │   │
│  │  Map<dataSourceId, ParsedData>                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              ANTHROPIC API (Claude AI)                       │
│  - Model: claude-sonnet-4-5 (or user-selected)              │
│  - Two-phase processing (Analysis → Response)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Client-Side)
- **React 19**: UI library for building components
- **Next.js 16 (App Router)**: React framework with server-side rendering
- **TypeScript 5.9**: Type-safe JavaScript
- **Material-UI 6**: Component library for UI elements
- **Recharts**: Charting library for data visualizations
- **Lucide Icons**: Icon library

### Backend (Server-Side)
- **Next.js API Routes**: Serverless API endpoints
- **Anthropic SDK**: Claude AI integration
- **xlsx Library**: Excel file parsing
- **Zod**: Runtime type validation
- **Node.js**: JavaScript runtime

### Architecture Pattern
- **Full-Stack Framework**: Next.js handles both frontend and backend
- **In-Memory Storage**: No database required (data stored in server memory)
- **Stateless API**: Each request is independent
- **Server Components + Client Components**: Hybrid rendering approach

---

## Client-Side (Frontend)

### 1. Main Page (`app/page.tsx`)

**Purpose:** Root component that manages the application state

**Key Responsibilities:**
- Displays upload interface when no file is uploaded
- Shows chat interface after file upload
- Manages uploaded data state
- Provides example queries

**State Management:**
```typescript
const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);
```

**Flow:**
1. User sees landing page with upload area
2. After upload, `uploadedData` is set
3. Page switches to chat interface
4. "Upload new file" button resets state

---

### 2. File Upload Component (`components/FileUpload.tsx`)

**Purpose:** Handles Excel file uploads with drag-and-drop

**Key Features:**
- Drag-and-drop zone
- File type validation (.xlsx, .xls)
- Progress indication
- Material-UI Card design

**Process:**
```typescript
1. User drops/selects file
   ↓
2. Validate file type
   ↓
3. Create FormData with file
   ↓
4. POST to /api/data/upload
   ↓
5. Receive dataSourceId + schema
   ↓
6. Call onUploadSuccess callback
```

**API Call:**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/data/upload', {
  method: 'POST',
  body: formData,
});

const data: UploadResponse = await response.json();
// data = { dataSourceId, fileName, schema, preview }
```

---

### 3. Chat Interface (`components/ChatInterface.tsx`)

**Purpose:** Main chat UI for asking questions about data

**Key State:**
```typescript
const [messages, setMessages] = useState<MessageType[]>([]);
const [inputValue, setInputValue] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-5');
```

**Message Flow:**
```typescript
1. User types question
   ↓
2. Add user message to state
   ↓
3. POST to /api/chat with query + dataSourceId + model
   ↓
4. Show loading indicator
   ↓
5. Receive response (text + optional visualization)
   ↓
6. Add AI message to state
   ↓
7. Render message with ChartRenderer if visualization exists
```

**Message Structure:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visualization?: ChartData;
  timestamp: Date;
}
```

---

### 4. Model Selector (`components/ModelSelector.tsx`)

**Purpose:** Dropdown to select which Claude model to use

**How It Works:**
```typescript
1. Component mounts
   ↓
2. Fetch /api/models (GET)
   ↓
3. Receive list of available models based on API key
   ↓
4. Display models in dropdown
   ↓
5. User selects model
   ↓
6. Call onModelChange(modelId)
   ↓
7. Parent component updates selectedModel state
   ↓
8. Next chat request uses selected model
```

**Why Dynamic?**
- Different API keys have access to different models
- App automatically detects what you can use
- No hardcoded model list

---

### 5. Chart Renderer (`components/ChartRenderer.tsx`)

**Purpose:** Dynamically renders different chart types

**Supported Chart Types:**
- **Bar Chart**: Compare categories (sales by product)
- **Pie Chart**: Show proportions (market share)
- **Line Chart**: Show trends over time (monthly revenue)
- **Table**: Display filtered data rows

**How It Works:**
```typescript
// Receives chart data from API
const visualization: ChartData = {
  type: 'bar',
  data: [
    { name: 'Product A', value: 1250 },
    { name: 'Product B', value: 890 },
  ],
  config: {
    xAxis: 'Product',
    yAxis: 'Sales',
  }
};

// Component switches on type
switch (visualization.type) {
  case 'bar':
    return <BarChart data={...} />;
  case 'pie':
    return <PieChart data={...} />;
  // ... etc
}
```

**Smart X-Axis Labels:**
- If more than 10 data points, samples ~8 labels
- Prevents overlapping text
- Rotates labels 45° for readability

---

## Server-Side (Backend)

### 1. Upload Endpoint (`app/api/data/upload/route.ts`)

**Purpose:** Parse Excel files and store data in memory

**Process:**
```typescript
export async function POST(request: Request) {
  // 1. Extract file from FormData
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // 2. Validate file type
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // 3. Parse Excel file
  const parsedData = await dataService.parseExcelFile(file);

  // 4. Store in memory with UUID
  const dataSourceId = dataService.storeData(parsedData);

  // 5. Return metadata
  return Response.json({
    dataSourceId,
    fileName: parsedData.fileName,
    schema: parsedData.schema,
    preview: parsedData.preview,
  });
}
```

**What Gets Stored:**
```typescript
{
  id: "uuid-here",
  fileName: "sales-data.xlsx",
  schema: {
    columns: [
      { name: "Product", type: "string", sample: ["A", "B", "C"] },
      { name: "Revenue", type: "number", sample: [1000, 2000, 3000] },
    ],
    rowCount: 100
  },
  data: [ /* all rows */ ],
  preview: [ /* first 5 rows */ ]
}
```

---

### 2. Chat Endpoint (`app/api/chat/route.ts`)

**Purpose:** Process user questions and generate responses with visualizations

**Full Process:**
```typescript
export async function POST(request: NextRequest) {
  const { query, dataSourceId, model } = await request.json();

  // STEP 1: Retrieve stored data
  const parsedData = dataService.getData(dataSourceId);

  // STEP 2: Initialize LLM with selected model
  const llmService = new LLMService(undefined, model);

  // STEP 3: Phase 1 - Analyze Query
  const analysis = await llmService.analyzeQuery(
    query,
    parsedData.schema,
    parsedData.preview
  );
  // Returns: { intent, dataNeeded, aggregation, needsVisualization }

  // STEP 4: Filter & Aggregate Data
  let processedData = filterColumns(parsedData.data, analysis.dataNeeded.columns);
  processedData = applyAggregation(processedData, analysis.aggregation);

  // STEP 5: Phase 2 - Generate Response
  const aiResponse = await llmService.generateResponse(
    query,
    processedData,
    parsedData.schema
  );
  // Returns: { answer, visualization?: { type, reason, dataMapping } }

  // STEP 6: Transform to Chart Data
  let chartData = null;
  if (aiResponse.visualization) {
    chartData = chartSpecGenerator.generateChartSpec(
      aiResponse.visualization,
      processedData
    );
  }

  // STEP 7: Return Response
  return Response.json({
    textResponse: aiResponse.answer,
    visualization: chartData,
  });
}
```

---

### 3. Models Endpoint (`app/api/models/route.ts`)

**Purpose:** Detect which Claude models are available with the current API key

**How It Works:**
```typescript
const KNOWN_MODELS = [
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', ... },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', ... },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', ... },
  // ... more models
];

export async function GET() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const availableModels = [];

  // Test each model
  for (const model of KNOWN_MODELS) {
    try {
      await client.messages.create({
        model: model.id,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      // If no error, model is available
      availableModels.push(model);
    } catch (error) {
      // Model not available, skip
    }
  }

  return Response.json({
    models: availableModels,
    defaultModel: availableModels[0]?.id,
  });
}
```

**Why This Approach?**
- Different API tiers have different model access
- Can't rely on hardcoded list
- Tests actual access in real-time

---

## Data Flow

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UPLOAD PHASE                                              │
└─────────────────────────────────────────────────────────────┘
User uploads file
    ↓
FileUpload component creates FormData
    ↓
POST /api/data/upload
    ↓
Server: xlsx library parses Excel
    ↓
Server: Extract schema (column names, types, samples)
    ↓
Server: Store data in globalThis Map with UUID
    ↓
Server: Return { dataSourceId, schema, preview }
    ↓
Client: Show chat interface

┌─────────────────────────────────────────────────────────────┐
│ 2. QUERY PHASE                                               │
└─────────────────────────────────────────────────────────────┘
User types question: "Which product sold most?"
    ↓
ChatInterface adds message to UI
    ↓
POST /api/chat { query, dataSourceId, model }
    ↓
Server: Retrieve data from Map using dataSourceId
    ↓
Server: Initialize LLM service with selected model
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LLM PHASE 1 - QUERY ANALYSIS                             │
└─────────────────────────────────────────────────────────────┘
Server: Build analysis prompt:
  - User query
  - Data schema (column names, types, samples)
  - First 5 rows preview
    ↓
Server: Call Claude API
    ↓
Claude analyzes and returns JSON:
{
  "intent": "Find product with highest sales",
  "dataNeeded": {
    "columns": ["Product", "Quantity"],
    "filters": null
  },
  "aggregation": "groupby",
  "needsVisualization": true
}
    ↓
Server: Parse and validate with Zod

┌─────────────────────────────────────────────────────────────┐
│ 4. DATA PROCESSING                                           │
└─────────────────────────────────────────────────────────────┘
Server: Filter to needed columns
    ↓
Server: Apply groupby aggregation:
  Group by Product, Sum Quantity
    ↓
Result: [
  { Product: "Widget A", Quantity: 1250 },
  { Product: "Widget B", Quantity: 890 },
  ...
]
    ↓
Server: Limit to 100 rows for LLM

┌─────────────────────────────────────────────────────────────┐
│ 5. LLM PHASE 2 - RESPONSE GENERATION                        │
└─────────────────────────────────────────────────────────────┘
Server: Build response prompt:
  - User query
  - Processed data
  - Column names
    ↓
Server: Call Claude API again
    ↓
Claude generates JSON:
{
  "answer": "Widget A sold the most with 1,250 units...",
  "visualization": {
    "type": "bar",
    "reason": "Bar chart best compares quantities",
    "dataMapping": {
      "xAxis": "Product",
      "yAxis": "Quantity"
    }
  }
}
    ↓
Server: Parse and validate with Zod

┌─────────────────────────────────────────────────────────────┐
│ 6. CHART GENERATION                                          │
└─────────────────────────────────────────────────────────────┘
Server: chartSpecGenerator.generateChartSpec()
    ↓
Transform data for Recharts format:
{
  type: 'bar',
  data: [
    { name: 'Widget A', value: 1250 },
    { name: 'Widget B', value: 890 },
  ],
  config: {
    xAxis: 'Product',
    yAxis: 'Quantity'
  }
}

┌─────────────────────────────────────────────────────────────┐
│ 7. RESPONSE DELIVERY                                         │
└─────────────────────────────────────────────────────────────┘
Server: Return JSON:
{
  textResponse: "Widget A sold the most...",
  visualization: { /* chart data */ }
}
    ↓
Client: Add AI message to messages array
    ↓
Client: Render Message component
    ↓
Client: Message component renders ChartRenderer
    ↓
ChartRenderer: Switch on chart type, render BarChart
    ↓
User sees answer + bar chart
```

---

## Two-Phase LLM Approach

### Why Two Phases?

**Problem:** If we send all data to Claude in one request:
- Token limits would be exceeded
- Expensive (more tokens = higher cost)
- Slower processing
- Less accurate (too much noise)

**Solution:** Split into two focused phases

---

### Phase 1: Query Analysis

**Goal:** Understand what the user wants without seeing all the data

**Input:**
- User query: "Which product sold most?"
- Schema: Column names and types
- Preview: First 5 rows as examples

**Output:**
```json
{
  "intent": "Find the product with highest sales quantity",
  "dataNeeded": {
    "columns": ["Product", "Quantity"],
    "filters": null
  },
  "aggregation": "groupby",
  "needsVisualization": true
}
```

**Why This Works:**
- Claude can understand the intent from schema + preview
- Doesn't need to see all 10,000 rows
- Returns structured data we can process

---

### Phase 2: Response Generation

**Goal:** Generate natural language answer and visualization spec

**Input:**
- User query
- **Processed/filtered data** (only relevant columns, aggregated, max 100 rows)
- Column names

**Output:**
```json
{
  "answer": "Based on the data, Widget A sold the most with 1,250 units...",
  "visualization": {
    "type": "bar",
    "reason": "A bar chart clearly compares sales quantities across products",
    "dataMapping": {
      "xAxis": "Product",
      "yAxis": "Quantity"
    }
  }
}
```

**Why This Works:**
- Claude sees only the relevant, processed data
- Can generate accurate, specific answers
- Decides if visualization would help
- Specifies the right chart type

---

### Prompt Engineering

**Phase 1 Prompt Structure:**
```
You are a data analysis assistant.

Dataset Schema:
- Product (string): Sample values: Widget A, Widget B, Widget C
- Quantity (number): Sample values: 100, 200, 300
- Revenue (number): Sample values: 1000, 2000, 3000

Sample Data (first 5 rows):
{"Product": "Widget A", "Quantity": 100, "Revenue": 1000}
{"Product": "Widget B", "Quantity": 200, "Revenue": 2000}
...

User Query: "Which product sold the most?"

Your Task: Analyze this query and return JSON with:
- intent: What the user wants
- dataNeeded: Which columns are needed
- aggregation: sum|count|average|groupby|none
- needsVisualization: true/false

Return ONLY valid JSON, no markdown.
```

**Phase 2 Prompt Structure:**
```
You are a data analysis assistant.

User Query: "Which product sold the most?"

Query Results (3 rows):
{"Product": "Widget A", "Quantity": 1250}
{"Product": "Widget B", "Quantity": 890}
{"Product": "Widget C", "Quantity": 650}

Your Task: Generate a natural language answer and visualization.

Return JSON:
{
  "answer": "Your conversational answer here",
  "visualization": {
    "type": "bar|pie|line|table",
    "reason": "Why this chart type",
    "dataMapping": {
      "xAxis": "column name",
      "yAxis": "column name"
    }
  }
}

Return ONLY valid JSON, no markdown.
```

---

## Model Selection System

### Architecture

```
Client Component (ModelSelector)
    ↓
Fetches: GET /api/models
    ↓
Server tests each model:
  ┌────────────────────────────────────┐
  │ For each KNOWN_MODEL:              │
  │   Try: client.messages.create()    │
  │   Success → Add to available list  │
  │   Error → Skip                     │
  └────────────────────────────────────┘
    ↓
Returns: { models: [...], defaultModel: "..." }
    ↓
Client displays dropdown
    ↓
User selects model
    ↓
Selection stored in ChatInterface state
    ↓
Next query includes model parameter
    ↓
Server creates LLM service with that model
```

### Why Dynamic Detection?

**Problem:** Different API keys have different access
- Free tier: Maybe only Haiku
- Pro tier: Sonnet + Opus
- Enterprise: All models

**Solution:** Test in real-time
- No hardcoding
- Always accurate
- Graceful degradation

### Implementation Details

**Model Testing:**
```typescript
// Minimal request to check availability
await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 10,  // Minimal tokens = fast + cheap
  messages: [{ role: 'user', content: 'Hi' }],
});
// If no error thrown, model is available
```

**Cost:** ~$0.0001 per model tested (negligible)

---

## Visualization System

### Chart Type Decision Logic

**Bar Chart:**
- **When:** Comparing discrete categories
- **Example:** "Sales by product", "Revenue by region"
- **Data Structure:** `{ name: string, value: number }[]`

**Pie Chart:**
- **When:** Showing proportions/percentages
- **Example:** "Market share", "Sales % by region"
- **Data Structure:** `{ name: string, value: number }[]`

**Line Chart:**
- **When:** Trends over time
- **Example:** "Monthly revenue", "Daily signups"
- **Data Structure:** `{ name: string, value: number }[]`
- **Note:** Name should be date/time

**Table:**
- **When:** Detailed data that doesn't fit charts
- **Example:** "Show all orders over $5000"
- **Data Structure:** Array of objects with any properties

---

### Chart Spec Generator

**Purpose:** Transform Claude's output into Recharts format

**Process:**
```typescript
// Claude returns this
const visualization = {
  type: 'bar',
  dataMapping: {
    xAxis: 'Product',
    yAxis: 'Quantity'
  }
};

const processedData = [
  { Product: 'Widget A', Quantity: 1250, Revenue: 5000 },
  { Product: 'Widget B', Quantity: 890, Revenue: 3500 },
];

// Generator transforms to this
const chartSpec = {
  type: 'bar',
  data: [
    { name: 'Widget A', value: 1250 },
    { name: 'Widget B', value: 890 },
  ],
  config: {
    xAxis: 'Product',
    yAxis: 'Quantity',
  }
};
```

**Why Transform?**
- Recharts expects specific format
- Standardize across chart types
- Simplify client component logic

---

## In-Memory Storage

### Why No Database?

**Requirements:**
- No chat history needed
- No persistence across sessions
- Single-user per session
- Temporary data only

**Solution:** Store in server memory

### Implementation

```typescript
// Use globalThis to persist across Next.js hot reloads
const globalDataStore = globalThis as typeof globalThis & {
  __dataStore?: Map<string, ParsedData>;
};

if (!globalDataStore.__dataStore) {
  globalDataStore.__dataStore = new Map();
}

class DataService {
  private dataStore: Map<string, ParsedData> = globalDataStore.__dataStore!;

  storeData(parsedData: ParsedData): string {
    const id = crypto.randomUUID();
    this.dataStore.set(id, parsedData);
    return id;
  }

  getData(id: string): ParsedData | undefined {
    return this.dataStore.get(id);
  }
}
```

### Trade-offs

**Advantages:**
- ✅ Fast (no database queries)
- ✅ Simple (no schema, migrations)
- ✅ No infrastructure cost
- ✅ Perfect for prototype/demo

**Limitations:**
- ❌ Data lost on server restart
- ❌ Not suitable for production
- ❌ Single server only (no horizontal scaling)
- ❌ Limited by server RAM

---

## Key Technical Decisions

### 1. **Why Next.js App Router?**
- Server + Client components in one framework
- API routes without separate backend
- Built-in TypeScript support
- Server-side rendering for SEO
- File-based routing

### 2. **Why Material-UI?**
- Production-ready components
- Consistent design system
- Accessibility built-in
- Theme customization
- Responsive by default

### 3. **Why Anthropic Claude?**
- Excellent at structured output (JSON)
- Large context window (200k tokens)
- Reliable reasoning about data
- Multiple model tiers for cost optimization
- Strong instruction following

### 4. **Why Recharts?**
- React-native (declarative API)
- Responsive and mobile-friendly
- Composable components
- Good documentation
- TypeScript support

### 5. **Why In-Memory Storage?**
- No persistence requirement
- Simpler deployment
- Faster development
- Lower complexity
- Cost-effective for demo

---

## Security Considerations

### API Key Protection
```typescript
// ✅ GOOD: Server-side only
const apiKey = process.env.ANTHROPIC_API_KEY;

// ❌ BAD: Never send to client
// Exposed in browser = security breach
```

### File Upload Validation
```typescript
// Check file extension
if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
  return error;
}

// Check file size (could add)
if (file.size > 10 * 1024 * 1024) { // 10MB
  return error;
}
```

### Data Isolation
- Each upload gets unique UUID
- No way to access other users' data
- Data not logged or persisted

---

## Performance Optimizations

### 1. **Limited Data to LLM**
```typescript
// Don't send all 10,000 rows
const dataForLLM = processedData.slice(0, 100);
```

### 2. **Retry Logic with Exponential Backoff**
```typescript
private async callLLMWithRetry(prompt, retryCount = 0) {
  try {
    return await this.client.messages.create(...);
  } catch (error) {
    if (retryCount < 3 && error.status === 429) {
      await sleep(1000 * Math.pow(2, retryCount));
      return this.callLLMWithRetry(prompt, retryCount + 1);
    }
    throw error;
  }
}
```

### 3. **Smart Chart Labels**
```typescript
// Don't show 100 X-axis labels
if (data.length > 10) {
  const step = Math.ceil(data.length / 8);
  // Show every Nth label
}
```

### 4. **Temperature Tuning**
```typescript
temperature: 0.3  // Low = more consistent JSON output
```

---

## Error Handling

### Client-Side
```typescript
try {
  const response = await fetch('/api/chat', {...});
  if (!response.ok) throw new Error(...);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
} catch (err) {
  setError(err.message);
  // Show user-friendly error in UI
}
```

### Server-Side
```typescript
try {
  const analysis = await llmService.analyzeQuery(...);
  const validated = QueryAnalysisSchema.parse(analysis);
} catch (error) {
  console.error('Query analysis failed:', error);
  return Response.json(
    { error: 'Failed to analyze query' },
    { status: 500 }
  );
}
```

### Zod Validation
```typescript
const QueryAnalysisSchema = z.object({
  intent: z.string(),
  dataNeeded: z.object({
    columns: z.array(z.string()),
    filters: z.any().optional(),
  }),
  aggregation: z.enum(['sum', 'count', 'average', 'groupby', 'none']).optional(),
  needsVisualization: z.boolean(),
});

// Throws if structure doesn't match
const validated = QueryAnalysisSchema.parse(llmResponse);
```

---

## Conclusion

This application demonstrates a modern full-stack architecture:

1. **React + Next.js** for unified frontend/backend
2. **Material-UI** for professional UI
3. **Claude AI** for intelligent data analysis
4. **Two-phase LLM** approach for efficiency
5. **Dynamic model selection** for flexibility
6. **Recharts** for beautiful visualizations
7. **In-memory storage** for simplicity

The system is:
- ✅ Type-safe (TypeScript + Zod)
- ✅ Fast (in-memory data, optimized queries)
- ✅ Intelligent (Claude AI reasoning)
- ✅ User-friendly (drag-drop, natural language)
- ✅ Flexible (multiple models, chart types)
- ✅ Scalable architecture (can add database later)

Perfect for prototyping, demos, and educational purposes!
