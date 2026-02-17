# Quick Start Guide - Parallel Execution

This guide helps you execute the implementation with multiple agents working in parallel.

---

## 🎯 Goal

Build a ChatGPT clone with data visualization in **3-4 hours** using **4 parallel agents**.

---

## 📋 Prerequisites

- [ ] Read `SPEC.md` (comprehensive specification)
- [ ] Read `IMPLEMENTATION-TASKS.md` (detailed task breakdown)
- [ ] Have Anthropic API key ready (for Claude Opus 4.6)
- [ ] Have 4 Claude Code sessions ready (or equivalent AI agents)

---

## 🚀 Execution Plan

### Step 1: Setup (Single Agent - 15 min)

**Agent: Setup Agent**

Prompt:
```
I need you to set up a Next.js project for a ChatGPT clone with data visualization.

Please complete Phase 0 from IMPLEMENTATION-TASKS.md:
1. Initialize Next.js with TypeScript, Tailwind, App Router
2. Install dependencies: @anthropic-ai/sdk, xlsx, recharts, zod, lucide-react
3. Create the folder structure as specified
4. Create .env.local for ANTHROPIC_API_KEY
5. Create a sample Excel file with sales data in /public

Use the structure defined in SPEC.md section 10.
```

**Wait for completion before proceeding.**

---

### Step 2: Parallel Development (4 Agents - 60-75 min)

Launch 4 agents simultaneously with these prompts:

#### 🟦 Agent A: Data Upload & Parsing

Prompt:
```
I need you to implement the data upload and parsing functionality.

Complete WORKSTREAM A from IMPLEMENTATION-TASKS.md:
1. Build POST /api/data/upload endpoint
2. Implement DataService class with Excel parsing (xlsx library)
3. Create FileUpload.tsx component with drag-and-drop
4. Display file info and data preview
5. Test with sample Excel file

Requirements:
- Parse Excel files and extract schema (columns, types, row count)
- Store data in-memory with UUID as key
- Show first 5 rows as preview
- Handle errors gracefully

Reference SPEC.md sections 4.1 and 6.2 for API contracts and service specs.
```

#### 🟩 Agent B: LLM Integration

Prompt:
```
I need you to implement the LLM integration with Claude Opus 4.6.

Complete WORKSTREAM B from IMPLEMENTATION-TASKS.md:
1. Create LLMService class in /lib/llm-service.ts
2. Implement two-phase prompt approach:
   - Phase 1: Query analysis (understand intent, determine data needs)
   - Phase 2: Response generation (answer + visualization spec)
3. Use claude-opus-4-6 model via Anthropic SDK
4. Parse and validate JSON responses
5. Test with various query types

The prompts should return structured JSON. See SPEC.md section 5 for detailed
prompt templates and examples.

Test queries:
- "Which product sold the most?"
- "Show sales by region as a pie chart"
- "What's the revenue trend over time?"
```

#### 🟨 Agent C: Chat Interface

Prompt:
```
I need you to build the chat user interface.

Complete WORKSTREAM C from IMPLEMENTATION-TASKS.md:
1. Create ChatInterface.tsx with message list and input
2. Create Message.tsx component (user and AI messages)
3. Create DataSourceInfo.tsx (show connected file info)
4. Update app/page.tsx with overall layout
5. Add loading states, example queries, empty states
6. Make it mobile-responsive with Tailwind CSS

Focus on UX - this is critical for grading. Make it intuitive and visually
appealing. See SPEC.md section 6.1 for component specifications.

Note: The actual API integration will be done in Phase 2, so create the UI
with placeholder data for now.
```

#### 🟪 Agent D: Visualization Engine

Prompt:
```
I need you to build the chart rendering system.

Complete WORKSTREAM D from IMPLEMENTATION-TASKS.md:
1. Create ChartSpecGenerator class to transform data for Recharts
2. Build ChartRenderer.tsx component supporting:
   - Bar charts
   - Pie charts
   - Line charts
   - Table view
3. Make charts responsive and visually appealing
4. Test with sample data for each chart type

Use Recharts library. See SPEC.md section 6.1 for component specs and
section 5.2 for chart type decision matrix.

Each chart should have:
- Proper labels and axes
- Tooltips
- Legend
- Custom colors
- Responsive container
```

**All 4 agents work in parallel. Wait for all to complete.**

---

### Step 3: Integration (Single Agent - 45-60 min)

**Agent: Integration Agent**

Prompt:
```
I need you to integrate all components into a working end-to-end system.

Complete Phase 2 from IMPLEMENTATION-TASKS.md:
1. Finish /app/api/chat/route.ts to orchestrate:
   - Get data from DataService
   - Call LLMService for analysis
   - Filter/aggregate data
   - Call LLMService for response
   - Generate chart spec if needed
2. Connect frontend ChatInterface to backend API
3. Implement state management (pass dataSourceId between components)
4. Add error handling throughout
5. Test end-to-end flow with 10+ diverse queries

The chat API should follow the contract in SPEC.md section 4.2.

Test scenarios:
- Upload file → Ask query → Get text + chart
- Multiple queries on same dataset
- Invalid queries (graceful errors)
- Different chart types
```

---

### Step 4: Polish (Single Agent - 30 min)

**Agent: Polish Agent**

Prompt:
```
I need you to polish the app and prepare it for demo.

Complete Phase 3 from IMPLEMENTATION-TASKS.md:
1. Add example query chips that users can click
2. Improve loading animations and transitions
3. Polish error messages to be user-friendly
4. Test mobile responsiveness
5. Create compelling sample data
6. Prepare 3-4 impressive demo queries
7. Update README.md with setup and features

Focus on UX polish - make it feel professional and production-ready.
This is critical for grading.
```

---

## ✅ Completion Checklist

Before recording demo video:

### Functionality
- [ ] File upload works
- [ ] Queries return text responses
- [ ] Charts render correctly (bar, pie, line)
- [ ] At least 5 different queries work
- [ ] Error handling works

### UX
- [ ] Intuitive first-time experience
- [ ] Loading states are clear
- [ ] Professional design
- [ ] Mobile responsive
- [ ] No console errors

### Demo Ready
- [ ] Sample data is interesting
- [ ] 3-4 "wow" queries prepared
- [ ] App doesn't crash
- [ ] README is complete

---

## 🎬 Recording Demo Video

After completion, record a 3-minute Loom video covering:

1. **Demo** (90 sec): Show file upload, ask 3-4 queries with different visualizations
2. **Technical** (45 sec): Explain architecture, tech choices (Next.js, Claude Opus 4.6)
3. **Process** (30 sec): How you built it (parallel agents, time taken)
4. **Product** (15 sec): Key product decisions and reasoning

---

## 🆘 If You Get Stuck

### Common Issues:

**"LLM isn't returning valid JSON"**
- Check prompt formatting in SPEC.md section 5
- Add explicit JSON schema to prompt
- Use temperature: 0 for more consistent responses

**"Excel parsing fails"**
- Check file format (.xlsx vs .xls)
- Verify xlsx library is installed correctly
- Look at sample code in SPEC.md Appendix A

**"Charts not rendering"**
- Check data format matches Recharts expectations
- See ChartSpecGenerator examples in IMPLEMENTATION-TASKS.md
- Verify Recharts is installed

**"Components not communicating"**
- Check API contracts in SPEC.md section 4
- Verify state management is passing dataSourceId
- Look at integration flow in IMPLEMENTATION-TASKS.md Phase 2

### Questions to Ask Product Manager:

If requirements are unclear, ask (communication is graded!):
- Should we support multiple Excel sheets?
- What's the maximum file size?
- Should users be able to change chart types manually?
- Should we show example queries in the UI?
- Should we explain why a chart type was chosen?

---

## 📊 Time Tracking

Track actual time spent:

- [ ] Setup: ____ min (target: 15)
- [ ] Workstream A: ____ min (target: 60)
- [ ] Workstream B: ____ min (target: 75)
- [ ] Workstream C: ____ min (target: 60)
- [ ] Workstream D: ____ min (target: 75)
- [ ] Integration: ____ min (target: 60)
- [ ] Polish: ____ min (target: 30)

**Total: ____ (target: 3-4 hours)**

---

## 🎯 Remember

**Grading criteria (in order of importance):**
1. **UX** - Is it intuitive and pleasant to use?
2. **Product thinking** - Did you make smart decisions?
3. **Communication** - Did you ask questions when needed?
4. **Features** - Does it work as specified?
5. **Architecture** - Is the code well-structured?

Good luck! 🚀
