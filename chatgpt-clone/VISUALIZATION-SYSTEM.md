# Visualization System Documentation

## Overview

The Visualization Engine provides a robust, type-safe system for transforming raw query results into beautiful, interactive charts. Built with Recharts and TypeScript, it supports multiple chart types with graceful error handling.

## Architecture

```
┌─────────────────────┐
│   Raw Query Data    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ChartSpecGenerator  │  ← Transforms data
│  generateSpec()     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    ChartData        │  ← Recharts-compatible format
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ChartRenderer      │  ← Renders visualization
│  (React Component)  │
└─────────────────────┘
```

## Components

### 1. ChartSpecGenerator (`/lib/chart-spec-generator.ts`)

**Purpose:** Transforms raw data into Recharts-compatible formats.

**Key Method:**
```typescript
generateSpec(
  type: ChartType,
  data: any[],
  mapping: DataMapping
): ChartData
```

**Supported Transformations:**

#### Bar Chart
```typescript
// Input
[
  { product: 'Laptop', revenue: 45000 },
  { product: 'Phone', revenue: 32000 }
]

// Output
{
  type: 'bar',
  data: [
    { name: 'Laptop', value: 45000 },
    { name: 'Phone', value: 32000 }
  ],
  config: { xAxis: 'product', yAxis: 'revenue' }
}
```

#### Pie Chart
```typescript
// Input
[
  { category: 'Electronics', sales: 450 },
  { category: 'Clothing', sales: 250 }
]

// Output
{
  type: 'pie',
  data: [
    { name: 'Electronics', value: 450 },
    { name: 'Clothing', value: 250 }
  ],
  config: { labels: ['Electronics', 'Clothing'] }
}
```

#### Line Chart
```typescript
// Input
[
  { date: '2024-01', sales: 10000 },
  { date: '2024-02', sales: 12000 }
]

// Output
{
  type: 'line',
  data: [
    { x: '2024-01', y: 10000 },
    { x: '2024-02', y: 12000 }
  ],
  config: { xAxis: 'date', yAxis: 'sales' }
}
```

#### Table
```typescript
// Input & Output (pass-through)
[
  { product: 'Laptop', price: 1299, stock: 45 },
  { product: 'Phone', price: 799, stock: 120 }
]
```

**Features:**
- ✅ Nested field support (e.g., `user.name`, `stats.total`)
- ✅ String-to-number conversion (handles `$1,000` → `1000`)
- ✅ Date formatting for line charts
- ✅ Graceful error handling for missing fields
- ✅ Default values for incomplete data

**Usage Example:**
```typescript
import { chartSpecGenerator } from '@/lib/chart-spec-generator';

const chartData = chartSpecGenerator.generateSpec(
  'bar',
  queryResults,
  { nameField: 'product', valueField: 'revenue' }
);
```

### 2. ChartRenderer (`/components/ChartRenderer.tsx`)

**Purpose:** React component that renders charts based on ChartData.

**Props:**
```typescript
interface ChartRendererProps {
  chartData: ChartData;
}
```

**Features:**

#### Bar Chart
- Responsive container (100% width, 400px height)
- Rounded bars with gradient effect
- Rotated x-axis labels for long names
- Custom tooltips with shadow
- Color: Blue (#3b82f6)

#### Pie Chart
- Percentage labels on each slice
- 10-color palette for variety
- Interactive tooltips showing value and percentage
- Responsive legend at bottom
- Labels with connecting lines

#### Line Chart
- Smooth curves with animation
- Grid lines for readability
- Hover dots with active state
- Configurable for time series data
- Color: Blue (#3b82f6)

#### Table
- Sticky header for scrolling
- Alternating row colors (white/gray)
- Max height with vertical scroll (500px)
- Horizontal scroll for wide tables
- Number formatting with commas
- Row count footer

**Color Palette:**
```typescript
const COLORS = [
  '#3b82f6',  // blue-500
  '#8b5cf6',  // violet-500
  '#ec4899',  // pink-500
  '#f59e0b',  // amber-500
  '#10b981',  // emerald-500
  '#06b6d4',  // cyan-500
  '#f97316',  // orange-500
  '#6366f1',  // indigo-500
  '#14b8a6',  // teal-500
  '#a855f7',  // purple-500
];
```

**Usage Example:**
```typescript
import ChartRenderer from '@/components/ChartRenderer';

<ChartRenderer chartData={chartData} />
```

## Error Handling

### Empty Data
```tsx
// Shows user-friendly message
<div className="p-8 bg-gray-50 rounded-lg border-dashed">
  <p>No data to display</p>
  <p>Try adjusting your query</p>
</div>
```

### Invalid Chart Type
```tsx
// Shows error message
<div className="p-4 bg-red-50 text-red-700">
  Unsupported chart type: {type}
</div>
```

### Missing Fields
```typescript
// ChartSpecGenerator handles gracefully
// Uses default values and filters invalid entries
const value = this.extractNumericValue(item, field, 0);
```

## Integration Example

### Complete Flow
```typescript
import { chartSpecGenerator } from '@/lib/chart-spec-generator';
import ChartRenderer from '@/components/ChartRenderer';

// 1. Get query results from data source
const queryResults = [
  { month: 'Jan', revenue: 10000 },
  { month: 'Feb', revenue: 12000 },
  // ...
];

// 2. Generate chart specification
const chartData = chartSpecGenerator.generateSpec(
  'line',
  queryResults,
  { xAxis: 'month', yAxis: 'revenue' }
);

// 3. Render chart
return <ChartRenderer chartData={chartData} />;
```

### With LLM Response
```typescript
// From ChatResponse
interface ChatResponse {
  textResponse: string;
  visualization?: ChartData;
}

// In component
{response.visualization && (
  <ChartRenderer chartData={response.visualization} />
)}
```

## Chart Selection Guide

| Chart Type | Best For | Example Use Cases |
|------------|----------|-------------------|
| **Bar** | Comparing categories | Product sales, regional performance |
| **Pie** | Showing proportions | Market share, category distribution |
| **Line** | Trends over time | Monthly revenue, user growth |
| **Table** | Detailed raw data | Transaction lists, inventory |

## Testing

### Demo Page
Visit: `http://localhost:3000/demo-charts`

Shows all chart types with sample data.

### Unit Tests
Location: `/lib/__tests__/chart-spec-generator.test.ts`

Tests cover:
- ✅ All chart types
- ✅ Empty data handling
- ✅ Missing fields
- ✅ Nested field paths
- ✅ String-to-number conversion

Run tests:
```bash
npm test
```

## Responsive Design

All charts are fully responsive:
- Desktop: Full width containers
- Tablet: Adjusted margins and spacing
- Mobile: Horizontal scroll for tables, smaller chart heights

## Performance

- Lazy loading with 'use client' directive
- Efficient data transformation (O(n))
- Recharts animation optimizations
- No unnecessary re-renders

## Future Enhancements

Potential improvements:
- [ ] Scatter plot support
- [ ] Multi-line charts
- [ ] Stacked bar charts
- [ ] Export to PNG/SVG
- [ ] Interactive data filtering
- [ ] Chart animations customization
- [ ] Dark mode support

## Dependencies

```json
{
  "recharts": "^3.7.0",
  "react": "^19.0.0",
  "next": "^16.1.6"
}
```

## File Structure

```
/lib/
  ├── chart-spec-generator.ts    # Data transformation service
  ├── types.ts                   # TypeScript interfaces
  └── __tests__/
      └── chart-spec-generator.test.ts

/components/
  └── ChartRenderer.tsx          # Chart rendering component

/app/
  └── demo-charts/
      └── page.tsx               # Demo page
```

## API Reference

### ChartSpecGenerator

#### `generateSpec(type, data, mapping): ChartData`

**Parameters:**
- `type` - Chart type: 'bar' | 'pie' | 'line' | 'table' | 'scatter'
- `data` - Array of data objects
- `mapping` - Field mapping object
  - `nameField?` - Field for category names
  - `valueField?` - Field for numeric values
  - `xAxis?` - Field for x-axis
  - `yAxis?` - Field for y-axis

**Returns:** `ChartData` object

### ChartRenderer

#### Props

```typescript
interface ChartRendererProps {
  chartData: ChartData;
}
```

**chartData:**
```typescript
interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'table' | 'scatter';
  data: any[];
  config: {
    title?: string;
    xAxis?: string;
    yAxis?: string;
    labels?: string[];
  };
}
```

## Best Practices

1. **Always validate data** before generating specs
2. **Use meaningful field names** in mapping
3. **Provide titles** for better UX
4. **Handle edge cases** (empty data, missing fields)
5. **Test with real data** from your data source
6. **Use appropriate chart types** for your data
7. **Consider mobile users** when designing layouts

## Troubleshooting

### Issue: Chart not rendering
**Solution:** Check that data array is not empty and fields exist

### Issue: Wrong data displayed
**Solution:** Verify field mapping matches your data structure

### Issue: Numbers showing as strings
**Solution:** ChartSpecGenerator handles conversion automatically

### Issue: Chart too small on mobile
**Solution:** Charts are responsive by default, check container width

## Support

For issues or questions:
1. Check this documentation
2. Review demo page examples
3. Examine test files for usage patterns
4. Verify TypeScript types match your data

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2026-02-16
