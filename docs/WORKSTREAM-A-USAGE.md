# Workstream A: Quick Usage Guide

## For Developers Implementing Workstreams B, C, D

### How to Access Uploaded Data

```typescript
// Import the data service
import { dataService } from '@/lib/data-service';

// Retrieve uploaded data by ID
const dataSourceId = "9e62aa1a-05b4-4b64-be26-e6e2103133eb"; // From upload response
const parsedData = dataService.getData(dataSourceId);

if (parsedData) {
  console.log('File name:', parsedData.fileName);
  console.log('Total rows:', parsedData.schema.rowCount);
  console.log('Columns:', parsedData.schema.columns);
  console.log('Full dataset:', parsedData.data); // Array of all rows
  console.log('Preview:', parsedData.preview);   // First 5 rows
}
```

### Data Structure Reference

```typescript
// What you get from dataService.getData(id):
interface ParsedData {
  id: string;              // UUID
  fileName: string;        // "sample-sales-data.xlsx"
  schema: {
    columns: [
      {
        name: string;      // "Product", "Revenue", etc.
        type: 'string' | 'number' | 'date' | 'boolean';
        sample: any[];     // First 3 values from this column
      }
    ],
    rowCount: number;      // Total number of data rows
  };
  data: any[];            // Full dataset as array of objects
  preview: any[];         // First 5 rows
}

// Example data row:
{
  "Date": "2024-01-15",
  "Product": "Widget A",
  "Region": "North",
  "Quantity": "100",
  "Revenue": "5000"
}
```

### Query the Data (for LLM/Chat workstreams)

```typescript
import { dataService } from '@/lib/data-service';

// Get the data
const parsedData = dataService.getData(dataSourceId);
if (!parsedData) {
  throw new Error('Data source not found');
}

// Filter rows
const highValueSales = parsedData.data.filter(row =>
  parseInt(row.Revenue) > 7000
);

// Group by column
const salesByRegion = parsedData.data.reduce((acc, row) => {
  const region = row.Region;
  acc[region] = (acc[region] || 0) + parseInt(row.Revenue);
  return acc;
}, {});

// Get column values
const allProducts = [...new Set(parsedData.data.map(row => row.Product))];

// Calculate totals
const totalRevenue = parsedData.data.reduce((sum, row) =>
  sum + parseInt(row.Revenue), 0
);
```

### Using in API Routes

```typescript
// In your API route (e.g., /api/chat/route.ts)
import { dataService } from '@/lib/data-service';

export async function POST(request: Request) {
  const { query, dataSourceId } = await request.json();

  // Get the uploaded data
  const parsedData = dataService.getData(dataSourceId);

  if (!parsedData) {
    return Response.json(
      { error: 'Data source not found' },
      { status: 404 }
    );
  }

  // Use parsedData.data for querying
  // Use parsedData.schema for understanding column types

  // ... your LLM/query logic here

  return Response.json({ result: 'success' });
}
```

### Using in React Components

```typescript
'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import type { UploadResponse } from '@/lib/types';

export default function MyComponent() {
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);

  const handleUploadSuccess = (response: UploadResponse) => {
    setUploadedData(response);

    // Now you have:
    console.log('Data Source ID:', response.dataSourceId);
    console.log('Schema:', response.schema);
    console.log('Preview:', response.preview);

    // Pass dataSourceId to other components
    // The actual data is stored server-side via dataService
  };

  return (
    <div>
      <FileUpload onUploadSuccess={handleUploadSuccess} />

      {uploadedData && (
        <YourChatComponent dataSourceId={uploadedData.dataSourceId} />
      )}
    </div>
  );
}
```

### Column Type Detection Rules

The data service automatically detects column types:

```typescript
// NUMBER - Detects if >80% of values are numeric
"100"       → number
"$5,000"    → number (strips $, commas)
"50%"       → number (strips %)
"1.234"     → number (decimals)

// DATE - Detects if >80% of values are valid dates
"2024-01-15"      → date
"01/15/2024"      → date
"2024/01/15"      → date

// BOOLEAN - Detects if >80% of values are boolean-like
"true" / "false"  → boolean
"yes" / "no"      → boolean
"TRUE" / "FALSE"  → boolean

// STRING - Default fallback
"Widget A"        → string
Mixed types       → string
```

### Testing Your Integration

```bash
# Start dev server
npm run dev

# Upload a file via UI
# Open http://localhost:3000
# Drag and drop an Excel file

# Or test via API
curl -X POST http://localhost:3000/api/data/upload \
  -F "file=@public/sample-sales-data.xlsx"

# Retrieve the data
curl "http://localhost:3000/api/data/upload?id={dataSourceId}"
```

### Example: Building a Query Function

```typescript
import { dataService } from '@/lib/data-service';

export function executeQuery(
  dataSourceId: string,
  columnName: string,
  operation: 'sum' | 'average' | 'count' | 'max' | 'min'
) {
  const parsedData = dataService.getData(dataSourceId);
  if (!parsedData) return null;

  const values = parsedData.data
    .map(row => row[columnName])
    .filter(val => val != null)
    .map(val => parseFloat(val))
    .filter(val => !isNaN(val));

  switch (operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
  }
}

// Usage:
const totalRevenue = executeQuery(dataSourceId, 'Revenue', 'sum');
const avgQuantity = executeQuery(dataSourceId, 'Quantity', 'average');
```

### Example: Preparing Data for LLM Context

```typescript
import { dataService } from '@/lib/data-service';

export function getDataContext(dataSourceId: string): string {
  const parsedData = dataService.getData(dataSourceId);
  if (!parsedData) return '';

  // Create a summary for the LLM
  const context = `
Dataset: ${parsedData.fileName}
Total Rows: ${parsedData.schema.rowCount}

Columns:
${parsedData.schema.columns.map(col =>
  `- ${col.name} (${col.type}): ${col.sample.join(', ')}`
).join('\n')}

Sample Data (first 5 rows):
${JSON.stringify(parsedData.preview, null, 2)}
`;

  return context;
}

// Usage in LLM prompt:
const dataContext = getDataContext(dataSourceId);
const prompt = `
${dataContext}

User Question: ${userQuery}

Please analyze the data and provide insights.
`;
```

### Common Patterns

#### Pattern 1: Validate Data Source Exists
```typescript
const data = dataService.getData(dataSourceId);
if (!data) {
  return { error: 'Data source not found or expired' };
}
```

#### Pattern 2: Get Column by Type
```typescript
const numericColumns = data.schema.columns
  .filter(col => col.type === 'number')
  .map(col => col.name);
```

#### Pattern 3: Transform for Charts
```typescript
const chartData = data.data.map(row => ({
  name: row.Product,
  value: parseInt(row.Revenue)
}));
```

#### Pattern 4: Group and Aggregate
```typescript
const aggregated = data.data.reduce((acc, row) => {
  const key = row.Region;
  if (!acc[key]) {
    acc[key] = { region: key, total: 0, count: 0 };
  }
  acc[key].total += parseInt(row.Revenue);
  acc[key].count += 1;
  return acc;
}, {});
```

## Tips for Next Workstreams

1. **Always check if data exists** before using `dataService.getData()`
2. **Use schema.columns** to understand available columns and their types
3. **Parse numbers/dates** as needed (they come as strings from Excel)
4. **Use preview** for quick UI display, use `data` for full analysis
5. **Remember**: Data is in-memory only (lost on server restart)
6. **Type safety**: Import types from `@/lib/types`

## Questions?

Check these files for reference:
- `/lib/data-service.ts` - Implementation details
- `/lib/types.ts` - TypeScript interfaces
- `/app/api/data/upload/route.ts` - API example usage
- `/components/FileUpload.tsx` - UI integration example
