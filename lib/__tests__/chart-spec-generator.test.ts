/**
 * Test file demonstrating ChartSpecGenerator usage
 * Run with: npm test (if Jest is configured)
 */

import { ChartSpecGenerator } from '../chart-spec-generator';

// Sample data for testing
const salesData = [
  { product: 'Laptop', revenue: 45000, units: 150 },
  { product: 'Phone', revenue: 32000, units: 400 },
  { product: 'Tablet', revenue: 28000, units: 350 },
  { product: 'Watch', revenue: 15000, units: 500 },
];

const timeSeriesData = [
  { date: '2024-01', sales: 10000 },
  { date: '2024-02', sales: 12000 },
  { date: '2024-03', sales: 15000 },
  { date: '2024-04', sales: 13000 },
  { date: '2024-05', sales: 18000 },
];

describe('ChartSpecGenerator', () => {
  let generator: ChartSpecGenerator;

  beforeEach(() => {
    generator = new ChartSpecGenerator();
  });

  test('should generate bar chart spec', () => {
    const result = generator.generateSpec('bar', salesData, {
      nameField: 'product',
      valueField: 'revenue',
    });

    expect(result.type).toBe('bar');
    expect(result.data.length).toBe(4);
    expect(result.data[0]).toHaveProperty('name');
    expect(result.data[0]).toHaveProperty('value');
    expect(result.data[0].name).toBe('Laptop');
    expect(result.data[0].value).toBe(45000);
  });

  test('should generate pie chart spec', () => {
    const result = generator.generateSpec('pie', salesData, {
      nameField: 'product',
      valueField: 'units',
    });

    expect(result.type).toBe('pie');
    expect(result.data.length).toBe(4);
    expect(result.data[0].name).toBe('Laptop');
    expect(result.data[0].value).toBe(150);
  });

  test('should generate line chart spec', () => {
    const result = generator.generateSpec('line', timeSeriesData, {
      xAxis: 'date',
      yAxis: 'sales',
    });

    expect(result.type).toBe('line');
    expect(result.data.length).toBe(5);
    expect(result.data[0]).toHaveProperty('x');
    expect(result.data[0]).toHaveProperty('y');
    expect(result.data[0].y).toBe(10000);
  });

  test('should generate table spec (passthrough)', () => {
    const result = generator.generateSpec('table', salesData, {});

    expect(result.type).toBe('table');
    expect(result.data.length).toBe(4);
    expect(result.data[0]).toEqual(salesData[0]);
  });

  test('should handle empty data', () => {
    const result = generator.generateSpec('bar', [], {
      nameField: 'product',
      valueField: 'revenue',
    });

    expect(result.type).toBe('bar');
    expect(result.data.length).toBe(0);
  });

  test('should handle missing fields gracefully', () => {
    const incompleteData = [
      { product: 'Laptop' }, // missing revenue
      { revenue: 1000 }, // missing product
    ];

    const result = generator.generateSpec('bar', incompleteData, {
      nameField: 'product',
      valueField: 'revenue',
    });

    expect(result.type).toBe('bar');
    // Should still generate data with defaults
    expect(result.data.length).toBeGreaterThan(0);
  });

  test('should handle nested field paths', () => {
    const nestedData = [
      { user: { name: 'John' }, stats: { total: 100 } },
      { user: { name: 'Jane' }, stats: { total: 150 } },
    ];

    const result = generator.generateSpec('bar', nestedData, {
      nameField: 'user.name',
      valueField: 'stats.total',
    });

    expect(result.type).toBe('bar');
    expect(result.data[0].name).toBe('John');
    expect(result.data[0].value).toBe(100);
  });

  test('should convert string numbers to numeric values', () => {
    const stringData = [
      { product: 'A', revenue: '$1,000' },
      { product: 'B', revenue: '2000' },
    ];

    const result = generator.generateSpec('bar', stringData, {
      nameField: 'product',
      valueField: 'revenue',
    });

    expect(result.data[0].value).toBe(1000);
    expect(result.data[1].value).toBe(2000);
  });
});

// Example usage (not a test)
export function exampleUsage() {
  const generator = new ChartSpecGenerator();

  // Example 1: Bar chart
  const barChart = generator.generateSpec('bar', salesData, {
    nameField: 'product',
    valueField: 'revenue',
  });
  console.log('Bar Chart:', barChart);

  // Example 2: Pie chart
  const pieChart = generator.generateSpec('pie', salesData, {
    nameField: 'product',
    valueField: 'units',
  });
  console.log('Pie Chart:', pieChart);

  // Example 3: Line chart
  const lineChart = generator.generateSpec('line', timeSeriesData, {
    xAxis: 'date',
    yAxis: 'sales',
  });
  console.log('Line Chart:', lineChart);

  // Example 4: Table
  const table = generator.generateSpec('table', salesData, {});
  console.log('Table:', table);
}
