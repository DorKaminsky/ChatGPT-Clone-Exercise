# Visualization System - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Import the Service
```typescript
import { chartSpecGenerator } from '@/lib/chart-spec-generator';
```

### Step 2: Transform Your Data
```typescript
const chartData = chartSpecGenerator.generateSpec(
  'bar',                                    // Chart type
  queryResults,                             // Your data array
  { nameField: 'product', valueField: 'revenue' }  // Field mapping
);
```

### Step 3: Render the Chart
```typescript
import ChartRenderer from '@/components/ChartRenderer';

<ChartRenderer chartData={chartData} />
```

## 📊 Chart Types & When to Use Them

| Type | Use Case | Example |
|------|----------|---------|
| `bar` | Compare categories | Product sales, regional performance |
| `pie` | Show proportions | Market share, category breakdown |
| `line` | Show trends | Monthly revenue, user growth over time |
| `table` | Show raw data | Transaction lists, detailed records |

## 💡 Common Examples

### Bar Chart - Sales by Product
```typescript
const data = [
  { product: 'Laptop', revenue: 45000 },
  { product: 'Phone', revenue: 32000 },
];

const chart = chartSpecGenerator.generateSpec('bar', data, {
  nameField: 'product',
  valueField: 'revenue'
});
```

### Pie Chart - Category Distribution
```typescript
const data = [
  { category: 'Electronics', sales: 450 },
  { category: 'Clothing', sales: 250 },
];

const chart = chartSpecGenerator.generateSpec('pie', data, {
  nameField: 'category',
  valueField: 'sales'
});
```

### Line Chart - Monthly Trend
```typescript
const data = [
  { month: 'Jan', revenue: 10000 },
  { month: 'Feb', revenue: 12000 },
];

const chart = chartSpecGenerator.generateSpec('line', data, {
  xAxis: 'month',
  yAxis: 'revenue'
});
```

### Table - Raw Data
```typescript
const data = [
  { id: 1, name: 'Product A', price: 99.99 },
  { id: 2, name: 'Product B', price: 149.99 },
];

const chart = chartSpecGenerator.generateSpec('table', data, {});
```

## 🎨 Features

✅ **Automatic Formatting**
- Numbers: `1000` → `1,000`
- Currency: `"$1,000"` → `1000` (parsed)
- Dates: Auto-formatted for line charts

✅ **Nested Fields**
```typescript
{ user: { name: 'John' }, stats: { total: 100 } }
// Access with: 'user.name', 'stats.total'
```

✅ **Error Handling**
- Empty data → Shows friendly message
- Missing fields → Uses defaults
- Invalid types → Shows error state

✅ **Responsive Design**
- Mobile: Optimized layouts
- Tablet: Adjusted spacing
- Desktop: Full-width charts

## 🔧 Integration Example

### In API Route (`/api/chat/route.ts`)
```typescript
import { chartSpecGenerator } from '@/lib/chart-spec-generator';

export async function POST(req: Request) {
  const { query, dataSourceId } = await req.json();

  // 1. Query your data source
  const queryResults = await dataService.query(dataSourceId, sqlQuery);

  // 2. Get LLM decision on visualization
  const aiResponse = await llmService.analyzeAndRespond(query, schema);

  // 3. Generate chart if needed
  let visualization = undefined;
  if (aiResponse.visualization && queryResults.length > 0) {
    visualization = chartSpecGenerator.generateSpec(
      aiResponse.visualization.type,
      queryResults,
      aiResponse.visualization.dataMapping
    );
  }

  return Response.json({
    textResponse: aiResponse.answer,
    visualization
  });
}
```

### In Chat Component
```typescript
import ChartRenderer from '@/components/ChartRenderer';

export function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="message">
      {/* Text response */}
      <p>{message.content}</p>

      {/* Visualization if present */}
      {message.visualization && (
        <div className="mt-4">
          <ChartRenderer chartData={message.visualization} />
        </div>
      )}
    </div>
  );
}
```

## 📁 File Locations

```
/lib/
  ├── chart-spec-generator.ts              # Main service
  ├── chart-spec-generator.example.ts      # Usage examples
  └── __tests__/chart-spec-generator.test.ts

/components/
  └── ChartRenderer.tsx                    # React component

/app/
  └── demo-charts/page.tsx                 # Live demo
```

## 🎯 Demo

See all charts in action:
```bash
npm run dev
# Visit: http://localhost:3000/demo-charts
```

## 🐛 Troubleshooting

### Chart not showing?
- Check that `data` array is not empty
- Verify field names match your data
- Console will show helpful error messages

### Wrong data displayed?
- Double-check field mapping
- Use example file for reference
- Check data structure matches expected format

### Numbers showing as strings?
- ChartSpecGenerator handles this automatically
- Supports: `"1000"`, `"$1,000"`, `"1,000.50"`

## 📚 Full Documentation

For complete details:
- **Architecture & API:** See `/VISUALIZATION-SYSTEM.md`
- **Usage Examples:** See `/lib/chart-spec-generator.example.ts`
- **Completion Report:** See `/WORKSTREAM-D-COMPLETE.md`

## ✅ Quick Checklist

- [ ] Import `chartSpecGenerator` from `@/lib/chart-spec-generator`
- [ ] Import `ChartRenderer` from `@/components/ChartRenderer`
- [ ] Call `generateSpec()` with your data
- [ ] Pass result to `<ChartRenderer />`
- [ ] Handle empty states in your UI
- [ ] Test on mobile devices

## 🎉 You're Ready!

The visualization system is production-ready and handles:
- ✅ All chart types (bar, pie, line, table)
- ✅ Data transformation
- ✅ Error handling
- ✅ Responsive design
- ✅ Professional styling

Start building amazing data visualizations!

---

**Questions?** Check the full documentation in `/VISUALIZATION-SYSTEM.md`
