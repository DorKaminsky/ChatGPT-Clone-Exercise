/**
 * ChartSpecGenerator - Quick Reference Examples
 *
 * This file demonstrates common usage patterns for the ChartSpecGenerator service.
 * Copy and adapt these examples for your own use cases.
 */

import { chartSpecGenerator } from './chart-spec-generator';
import { ChartData } from './types';

// ============================================================================
// EXAMPLE 1: Bar Chart - Product Sales
// ============================================================================

export function exampleBarChart() {
  const salesData = [
    { product: 'Laptop Pro', revenue: 45000, units: 150 },
    { product: 'Wireless Mouse', revenue: 3200, units: 400 },
    { product: 'USB-C Cable', revenue: 2600, units: 350 },
    { product: 'Monitor 27"', revenue: 19950, units: 50 },
  ];

  const chartData = chartSpecGenerator.generateSpec(
    'bar',
    salesData,
    {
      nameField: 'product',
      valueField: 'revenue',
    }
  );

  console.log('Bar Chart Data:', chartData);
  // Output:
  // {
  //   type: 'bar',
  //   data: [
  //     { name: 'Laptop Pro', value: 45000 },
  //     { name: 'Wireless Mouse', value: 3200 },
  //     ...
  //   ],
  //   config: { xAxis: 'product', yAxis: 'revenue' }
  // }

  return chartData;
}

// ============================================================================
// EXAMPLE 2: Pie Chart - Category Distribution
// ============================================================================

export function examplePieChart() {
  const categoryData = [
    { category: 'Electronics', percentage: 45 },
    { category: 'Clothing', percentage: 25 },
    { category: 'Food & Beverage', percentage: 15 },
    { category: 'Books', percentage: 10 },
    { category: 'Other', percentage: 5 },
  ];

  const chartData = chartSpecGenerator.generateSpec(
    'pie',
    categoryData,
    {
      nameField: 'category',
      valueField: 'percentage',
    }
  );

  console.log('Pie Chart Data:', chartData);
  return chartData;
}

// ============================================================================
// EXAMPLE 3: Line Chart - Monthly Revenue Trend
// ============================================================================

export function exampleLineChart() {
  const monthlyData = [
    { month: '2024-01', revenue: 10000 },
    { month: '2024-02', revenue: 12000 },
    { month: '2024-03', revenue: 15000 },
    { month: '2024-04', revenue: 13000 },
    { month: '2024-05', revenue: 18000 },
    { month: '2024-06', revenue: 22000 },
  ];

  const chartData = chartSpecGenerator.generateSpec(
    'line',
    monthlyData,
    {
      xAxis: 'month',
      yAxis: 'revenue',
    }
  );

  console.log('Line Chart Data:', chartData);
  // Output:
  // {
  //   type: 'line',
  //   data: [
  //     { x: '2024-01', y: 10000 },
  //     { x: '2024-02', y: 12000 },
  //     ...
  //   ],
  //   config: { xAxis: 'month', yAxis: 'revenue' }
  // }

  return chartData;
}

// ============================================================================
// EXAMPLE 4: Table - Detailed Product List
// ============================================================================

export function exampleTable() {
  const productData = [
    { id: 1, name: 'Laptop Pro', price: 1299, stock: 45, category: 'Electronics' },
    { id: 2, name: 'Wireless Mouse', price: 29.99, stock: 120, category: 'Accessories' },
    { id: 3, name: 'USB-C Cable', price: 12.99, stock: 200, category: 'Accessories' },
  ];

  const chartData = chartSpecGenerator.generateSpec(
    'table',
    productData,
    {} // No mapping needed for tables
  );

  console.log('Table Data:', chartData);
  // Output:
  // {
  //   type: 'table',
  //   data: [ /* original data passed through */ ],
  //   config: {}
  // }

  return chartData;
}

// ============================================================================
// EXAMPLE 5: Nested Fields - User Statistics
// ============================================================================

export function exampleNestedFields() {
  const userData = [
    {
      user: { name: 'John Doe', id: 1 },
      stats: { totalPurchases: 1500, orderCount: 25 }
    },
    {
      user: { name: 'Jane Smith', id: 2 },
      stats: { totalPurchases: 2200, orderCount: 35 }
    },
  ];

  const chartData = chartSpecGenerator.generateSpec(
    'bar',
    userData,
    {
      nameField: 'user.name',        // Access nested field
      valueField: 'stats.totalPurchases', // Access nested field
    }
  );

  console.log('Nested Fields Chart:', chartData);
  return chartData;
}

// ============================================================================
// EXAMPLE 6: String Number Conversion - Financial Data
// ============================================================================

export function exampleStringConversion() {
  const financialData = [
    { department: 'Engineering', budget: '$150,000' },
    { department: 'Marketing', budget: '$75,000' },
    { department: 'Sales', budget: '$120,000' },
  ];

  const chartData = chartSpecGenerator.generateSpec(
    'bar',
    financialData,
    {
      nameField: 'department',
      valueField: 'budget', // Will be converted from "$150,000" to 150000
    }
  );

  console.log('String Conversion Chart:', chartData);
  return chartData;
}

// ============================================================================
// EXAMPLE 7: Error Handling - Empty Data
// ============================================================================

export function exampleEmptyData() {
  const emptyData: any[] = [];

  const chartData = chartSpecGenerator.generateSpec(
    'bar',
    emptyData,
    {
      nameField: 'product',
      valueField: 'revenue',
    }
  );

  console.log('Empty Data Chart:', chartData);
  // Output:
  // {
  //   type: 'bar',
  //   data: [],
  //   config: { title: 'No data available' }
  // }

  return chartData;
}

// ============================================================================
// EXAMPLE 8: Real-World Integration - API Response Handler
// ============================================================================

export function exampleAPIIntegration(
  queryResults: any[],
  visualizationType: 'bar' | 'pie' | 'line' | 'table',
  dataMapping: { nameField?: string; valueField?: string; xAxis?: string; yAxis?: string }
): ChartData {

  // Validate inputs
  if (!queryResults || queryResults.length === 0) {
    return {
      type: visualizationType,
      data: [],
      config: { title: 'No results found' },
    };
  }

  // Generate chart spec
  try {
    const chartData = chartSpecGenerator.generateSpec(
      visualizationType,
      queryResults,
      dataMapping
    );

    // Add custom title
    chartData.config.title = `${visualizationType.toUpperCase()} Chart - ${queryResults.length} records`;

    return chartData;
  } catch (error) {
    console.error('Error generating chart:', error);
    return {
      type: visualizationType,
      data: [],
      config: { title: 'Error generating visualization' },
    };
  }
}

// ============================================================================
// EXAMPLE 9: Dynamic Chart Type Selection
// ============================================================================

export function exampleDynamicChartType(
  data: any[],
  userPreference: 'comparison' | 'proportion' | 'trend' | 'detailed'
): ChartData {

  // Map user preference to chart type
  const chartTypeMap = {
    comparison: 'bar' as const,
    proportion: 'pie' as const,
    trend: 'line' as const,
    detailed: 'table' as const,
  };

  const chartType = chartTypeMap[userPreference];

  // Generate appropriate mapping based on data structure
  const firstRow = data[0];
  const mapping = {
    nameField: Object.keys(firstRow)[0], // First column as name
    valueField: Object.keys(firstRow)[1], // Second column as value
  };

  return chartSpecGenerator.generateSpec(chartType, data, mapping);
}

// ============================================================================
// EXAMPLE 10: Aggregated Data - Grouped Results
// ============================================================================

export function exampleAggregatedData() {
  // Data already aggregated (e.g., from SQL GROUP BY)
  const aggregatedData = [
    { region: 'North', totalSales: 125000, orderCount: 450 },
    { region: 'South', totalSales: 98000, orderCount: 380 },
    { region: 'East', totalSales: 142000, orderCount: 520 },
    { region: 'West', totalSales: 109000, orderCount: 410 },
  ];

  // Option 1: Sales by region (Bar Chart)
  const salesChart = chartSpecGenerator.generateSpec(
    'bar',
    aggregatedData,
    {
      nameField: 'region',
      valueField: 'totalSales',
    }
  );

  // Option 2: Order count distribution (Pie Chart)
  const ordersChart = chartSpecGenerator.generateSpec(
    'pie',
    aggregatedData,
    {
      nameField: 'region',
      valueField: 'orderCount',
    }
  );

  return { salesChart, ordersChart };
}

// ============================================================================
// USAGE IN COMPONENTS
// ============================================================================

/*
// In a React component:

import { chartSpecGenerator } from '@/lib/chart-spec-generator';
import ChartRenderer from '@/components/ChartRenderer';

export function MyComponent() {
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    // Fetch data from API
    fetch('/api/sales-data')
      .then(res => res.json())
      .then(data => {
        const chart = chartSpecGenerator.generateSpec(
          'bar',
          data,
          { nameField: 'product', valueField: 'revenue' }
        );
        setChartData(chart);
      });
  }, []);

  return (
    <div>
      {chartData ? (
        <ChartRenderer chartData={chartData} />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
*/

// ============================================================================
// QUICK REFERENCE
// ============================================================================

/*
Chart Types:
- 'bar'    → Comparisons between categories
- 'pie'    → Proportions and percentages
- 'line'   → Trends over time
- 'table'  → Detailed raw data

Data Mappings:
- Bar/Pie:  { nameField: string, valueField: string }
- Line:     { xAxis: string, yAxis: string }
- Table:    {} (no mapping needed)

Features:
✓ Nested field paths (e.g., 'user.name')
✓ String-to-number conversion
✓ Date formatting
✓ Default values for missing data
✓ Error handling with graceful degradation
*/
