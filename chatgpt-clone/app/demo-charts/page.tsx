'use client';

import React from 'react';
import ChartRenderer from '@/components/ChartRenderer';
import { ChartData } from '@/lib/types';

/**
 * Demo page showcasing all chart types
 * Visit: http://localhost:3000/demo-charts
 */
export default function DemoChartsPage() {
  // Sample data for demonstrations
  const barChartData: ChartData = {
    type: 'bar',
    data: [
      { name: 'Laptop', value: 45000 },
      { name: 'Phone', value: 32000 },
      { name: 'Tablet', value: 28000 },
      { name: 'Watch', value: 15000 },
      { name: 'Headphones', value: 8000 },
    ],
    config: {
      title: 'Revenue by Product Category',
      xAxis: 'Product',
      yAxis: 'Revenue ($)',
    },
  };

  const pieChartData: ChartData = {
    type: 'pie',
    data: [
      { name: 'Electronics', value: 45 },
      { name: 'Clothing', value: 25 },
      { name: 'Food', value: 15 },
      { name: 'Books', value: 10 },
      { name: 'Other', value: 5 },
    ],
    config: {
      title: 'Sales Distribution by Category',
    },
  };

  const lineChartData: ChartData = {
    type: 'line',
    data: [
      { x: 'Jan', y: 10000 },
      { x: 'Feb', y: 12000 },
      { x: 'Mar', y: 15000 },
      { x: 'Apr', y: 13000 },
      { x: 'May', y: 18000 },
      { x: 'Jun', y: 22000 },
    ],
    config: {
      title: 'Monthly Sales Trend',
      xAxis: 'Month',
      yAxis: 'Sales ($)',
    },
  };

  const tableData: ChartData = {
    type: 'table',
    data: [
      { product: 'Laptop Pro', category: 'Electronics', price: 1299, stock: 45, rating: 4.5 },
      { product: 'Wireless Mouse', category: 'Accessories', price: 29.99, stock: 120, rating: 4.2 },
      { product: 'USB-C Cable', category: 'Accessories', price: 12.99, stock: 200, rating: 4.0 },
      { product: 'Monitor 27"', category: 'Electronics', price: 399, stock: 30, rating: 4.7 },
      { product: 'Keyboard Mechanical', category: 'Accessories', price: 89.99, stock: 75, rating: 4.6 },
    ],
    config: {
      title: 'Product Inventory',
    },
  };

  const emptyChartData: ChartData = {
    type: 'bar',
    data: [],
    config: {
      title: 'No Data Available',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Chart Visualization Demo
          </h1>
          <p className="text-gray-600">
            Demonstrating all chart types supported by ChartRenderer
          </p>
        </div>

        {/* Bar Chart */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Bar Chart
            </h2>
            <p className="text-gray-600 text-sm">
              Best for comparing values across categories
            </p>
          </div>
          <ChartRenderer chartData={barChartData} />
        </section>

        {/* Pie Chart */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Pie Chart
            </h2>
            <p className="text-gray-600 text-sm">
              Best for showing proportions and percentages
            </p>
          </div>
          <ChartRenderer chartData={pieChartData} />
        </section>

        {/* Line Chart */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Line Chart
            </h2>
            <p className="text-gray-600 text-sm">
              Best for showing trends over time
            </p>
          </div>
          <ChartRenderer chartData={lineChartData} />
        </section>

        {/* Table */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Table View
            </h2>
            <p className="text-gray-600 text-sm">
              Best for displaying detailed raw data
            </p>
          </div>
          <ChartRenderer chartData={tableData} />
        </section>

        {/* Empty State */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Empty State
            </h2>
            <p className="text-gray-600 text-sm">
              Graceful handling when no data is available
            </p>
          </div>
          <ChartRenderer chartData={emptyChartData} />
        </section>

        {/* Integration Example */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            Integration Example
          </h2>
          <div className="text-sm text-blue-800 space-y-2 font-mono bg-white p-4 rounded">
            <p>{'// Step 1: Transform data'}</p>
            <p>{'const chartData = chartSpecGenerator.generateSpec('}</p>
            <p className="pl-4">{'  "bar",'}</p>
            <p className="pl-4">{'  queryResults,'}</p>
            <p className="pl-4">{'  { nameField: "product", valueField: "revenue" }'}</p>
            <p>{');'}</p>
            <br />
            <p>{'// Step 2: Render chart'}</p>
            <p>{'<ChartRenderer chartData={chartData} />'}</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm pt-8 border-t">
          <p>
            Visualization Engine powered by Recharts | Built with Next.js & TypeScript
          </p>
        </footer>
      </div>
    </div>
  );
}
