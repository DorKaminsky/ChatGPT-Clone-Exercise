// Script to create sample Excel file with sales data
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Sample data
const sampleData = [
  { Date: '2024-01-15', Product: 'Widget A', Region: 'North', Quantity: 100, Revenue: 5000 },
  { Date: '2024-01-16', Product: 'Widget B', Region: 'South', Quantity: 150, Revenue: 7500 },
  { Date: '2024-01-17', Product: 'Widget A', Region: 'East', Quantity: 200, Revenue: 10000 },
  { Date: '2024-01-18', Product: 'Gadget X', Region: 'West', Quantity: 75, Revenue: 6000 },
  { Date: '2024-01-19', Product: 'Gadget Y', Region: 'North', Quantity: 120, Revenue: 8400 },
  { Date: '2024-01-20', Product: 'Widget A', Region: 'South', Quantity: 180, Revenue: 9000 },
  { Date: '2024-01-21', Product: 'Widget B', Region: 'East', Quantity: 160, Revenue: 8000 },
  { Date: '2024-01-22', Product: 'Gadget X', Region: 'North', Quantity: 90, Revenue: 7200 },
  { Date: '2024-01-23', Product: 'Widget A', Region: 'West', Quantity: 140, Revenue: 7000 },
  { Date: '2024-01-24', Product: 'Gadget Y', Region: 'South', Quantity: 110, Revenue: 7700 },
  { Date: '2024-01-25', Product: 'Widget B', Region: 'North', Quantity: 170, Revenue: 8500 },
  { Date: '2024-01-26', Product: 'Gadget X', Region: 'East', Quantity: 85, Revenue: 6800 },
  { Date: '2024-01-27', Product: 'Widget A', Region: 'South', Quantity: 195, Revenue: 9750 },
  { Date: '2024-01-28', Product: 'Gadget Y', Region: 'West', Quantity: 130, Revenue: 9100 },
  { Date: '2024-01-29', Product: 'Widget B', Region: 'North', Quantity: 155, Revenue: 7750 },
  { Date: '2024-01-30', Product: 'Widget A', Region: 'East', Quantity: 210, Revenue: 10500 },
  { Date: '2024-02-01', Product: 'Gadget X', Region: 'South', Quantity: 95, Revenue: 7600 },
  { Date: '2024-02-02', Product: 'Widget B', Region: 'West', Quantity: 165, Revenue: 8250 },
  { Date: '2024-02-03', Product: 'Gadget Y', Region: 'North', Quantity: 125, Revenue: 8750 },
  { Date: '2024-02-04', Product: 'Widget A', Region: 'East', Quantity: 205, Revenue: 10250 },
];

// Create worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Create workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write file
const filePath = path.join(publicDir, 'sample-sales-data.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`Sample data file created at: ${filePath}`);
console.log(`Total rows: ${sampleData.length}`);
console.log('Columns: Date, Product, Region, Quantity, Revenue');
