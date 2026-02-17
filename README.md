# ChatGPT Clone with Data Visualization

An intelligent data analysis tool that combines natural language queries with automatic visualizations. Upload your Excel files, ask questions in plain English, and get instant insights with beautiful charts.

![Powered by Claude 3.5 Sonnet](https://img.shields.io/badge/AI-Claude%203.5%20Sonnet-7c3aed)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Material-UI](https://img.shields.io/badge/Material--UI-Latest-blue)

## ✨ Features

- 📊 **Excel File Analysis** - Upload .xlsx/.xls files and query your data instantly
- 🤖 **AI-Powered Insights** - Claude 3.5 Sonnet understands your questions and generates intelligent responses
- 📈 **Automatic Visualizations** - AI selects the best chart type (bar, pie, line, table) for your query
- 💬 **Natural Language Interface** - No SQL or coding required - just ask questions
- 🎨 **Modern UI** - Beautiful, responsive interface built with Material-UI
- ⚡ **Real-Time Processing** - Get answers in seconds

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DorKaminsky/ChatGPT-Clone-Exercise.git
   cd ChatGPT-Clone-Exercise
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your API key:**

   Create `.env.local` file:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 📖 How to Use

1. **Upload Your Data**
   - Click or drag-and-drop an Excel file (.xlsx or .xls)
   - The system will analyze your data structure automatically
   - You'll see a preview of your columns and data

2. **Ask Questions**
   - Type questions in plain English
   - Click example queries to get started
   - Examples:
     - "Which product generated the most revenue?"
     - "Show me sales by region"
     - "What's the trend over time?"

3. **Get Insights**
   - Receive intelligent text responses
   - View automatic visualizations
   - Ask follow-up questions

## 🏗️ Architecture

### Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Material-UI 6
- **Backend:** Next.js API Routes
- **AI:** Claude 3.5 Sonnet via Anthropic SDK
- **Data Processing:** xlsx library for Excel parsing
- **Visualizations:** Recharts
- **Type Safety:** TypeScript
- **Validation:** Zod

### Two-Phase LLM Approach

```
User Query
    ↓
┌─────────────────────────────────┐
│ Phase 1: Query Analysis         │
│ - Understand intent             │
│ - Identify required data        │
│ - Determine aggregation         │
│ - Decide visualization need     │
└─────────────────────────────────┘
    ↓
Data Filtering & Aggregation
    ↓
┌─────────────────────────────────┐
│ Phase 2: Response Generation    │
│ - Generate text answer          │
│ - Select chart type             │
│ - Create data mapping           │
└─────────────────────────────────┘
    ↓
Display: Text + Chart
```

### Project Structure

```
chatgpt-clone/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Main chat endpoint
│   │   └── data/upload/route.ts   # File upload endpoint
│   ├── layout.tsx                 # Root layout with MUI theme
│   ├── page.tsx                   # Main page
│   └── globals.css                # Global styles
├── components/
│   ├── ChatInterface.tsx          # Chat UI component
│   ├── Message.tsx                # Message display component
│   ├── FileUpload.tsx             # File upload component
│   └── ChartRenderer.tsx          # Chart visualization component
├── lib/
│   ├── llm-service.ts             # Claude API integration
│   ├── data-service.ts            # Excel parsing & storage
│   ├── chart-spec-generator.ts    # Chart data transformation
│   └── types.ts                   # TypeScript interfaces
└── public/
    └── sample-sales-data.xlsx     # Sample dataset
```

## 🎯 Example Queries

Try these questions with the sample data:

- **Comparison:** "Which product sold the most?"
- **Proportions:** "Show sales percentage by region as a pie chart"
- **Trends:** "What's the revenue trend over time?"
- **Filtering:** "Show all orders above $7000"
- **Aggregation:** "What's the average revenue per region?"

## 🔧 Development

### Available Scripts

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm start       # Start production server
npm run lint    # Run ESLint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |
| `NODE_ENV` | Environment (development/production) | No |

### API Endpoints

#### POST /api/data/upload
Upload and parse Excel files.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (Excel file)

**Response:**
```json
{
  "dataSourceId": "uuid",
  "fileName": "data.xlsx",
  "schema": {
    "columns": [
      {"name": "Product", "type": "string", "sample": ["A", "B", "C"]},
      {"name": "Revenue", "type": "number", "sample": [1000, 2000, 3000]}
    ],
    "rowCount": 100
  },
  "preview": [/* first 5 rows */]
}
```

#### POST /api/chat
Process natural language queries.

**Request:**
```json
{
  "query": "Which product sold most?",
  "dataSourceId": "uuid",
  "conversationContext": ["previous", "messages"]
}
```

**Response:**
```json
{
  "textResponse": "Product A sold the most...",
  "visualization": {
    "type": "bar",
    "data": [{"name": "A", "value": 100}],
    "config": {"xAxis": "Product", "yAxis": "Sales"}
  }
}
```

## 🎨 Chart Types

The AI automatically selects the best visualization:

| Chart Type | Use Case | Example Query |
|------------|----------|---------------|
| **Bar Chart** | Compare categories | "Which product sold most?" |
| **Pie Chart** | Show proportions | "Sales % by region?" |
| **Line Chart** | Trends over time | "Revenue over months?" |
| **Table** | Raw filtered data | "Show orders over $5000" |

## 🐛 Troubleshooting

### "Model not available" error
- Check your API key has access to Claude 3.5 Sonnet
- Verify `ANTHROPIC_API_KEY` is set in `.env.local`

### "Data source not found" error
- Upload a file first before querying
- Ensure the upload was successful (green confirmation)

### Charts not rendering
- Check browser console for errors
- Verify data format matches chart requirements

## 🤝 Contributing

This is an educational project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT

## 📚 Documentation

Additional documentation can be found in the `/docs` directory:
- [CLAUDE.md](docs/CLAUDE.md) - Project guidance for Claude Code
- [IMPLEMENTATION-TASKS.md](docs/IMPLEMENTATION-TASKS.md) - Development task breakdown
- [SPEC.md](docs/SPEC.md) - Original project specification
- [Phase completion docs](docs/) - Detailed phase documentation

## 🙏 Acknowledgments

- **Claude 3.5 Sonnet** by Anthropic for AI capabilities
- **Next.js** for the full-stack framework
- **Material-UI** for beautiful components
- **Recharts** for visualization library

---

**Built as a demonstration of AI-powered data visualization** 🚀
