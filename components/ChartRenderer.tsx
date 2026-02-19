'use client';

import React, { useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Stack,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Download, ZoomIn, Image as ImageIcon, Description } from '@mui/icons-material';
import { ChartData } from '@/lib/types';
import html2canvas from 'html2canvas';

interface ChartRendererProps {
  chartData: ChartData;
}

// Professional color palette
const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
];

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData }) => {
  const { type, data, config } = chartData;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const menuOpen = Boolean(anchorEl);

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 font-medium">No data to display</p>
          <p className="text-gray-400 text-sm mt-1">
            {config.title || 'Try adjusting your query'}
          </p>
        </div>
      </div>
    );
  }

  // Handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Export chart as image (PNG)
  const exportAsImage = async () => {
    handleMenuClose();

    if (!chartRef.current) {
      setSnackbarMessage('Chart reference not found');
      setSnackbarOpen(true);
      return;
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `chart-${type}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setSnackbarMessage('Chart image downloaded successfully!');
          setSnackbarOpen(true);
        }
      });
    } catch (error) {
      console.error('Image export error:', error);
      setSnackbarMessage('Failed to export chart as image');
      setSnackbarOpen(true);
    }
  };

  // Export data as CSV
  const exportToCSV = () => {
    handleMenuClose();

    try {
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `chart-data-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSnackbarMessage('Data exported as CSV successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Export error:', error);
      setSnackbarMessage('Failed to export data');
      setSnackbarOpen(true);
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      ),
    ];
    return csvRows.join('\n');
  };

  try {
    return (
      <>
        {type !== 'table' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              title="Download chart"
              sx={{
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: 'primary.100' },
              }}
            >
              <Download fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={exportAsImage}>
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download as Image (PNG)</ListItemText>
              </MenuItem>
              <MenuItem onClick={exportToCSV}>
                <ListItemIcon>
                  <Description fontSize="small" />
                </ListItemIcon>
                <ListItemText>Download Data (CSV)</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        )}

        <div ref={chartRef}>
          {(() => {
            switch (type) {
              case 'bar':
                return <BarChartComponent data={data} config={config} />;
              case 'pie':
                return <PieChartComponent data={data} config={config} />;
              case 'line':
                return <LineChartComponent data={data} config={config} />;
              case 'table':
                return <TableComponent data={data} config={config} onExport={exportToCSV} onExportImage={exportAsImage} />;
              case 'scatter':
                return <LineChartComponent data={data} config={config} isScatter />;
              default:
                return (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                    Unsupported chart type: {type}
                  </div>
                );
            }
          })()}
        </div>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  } catch (error) {
    console.error('Error rendering chart:', error);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">Error rendering chart</p>
        <p className="text-sm mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }
};

// Bar Chart Component
const BarChartComponent: React.FC<{ data: any[]; config: any }> = ({
  data,
  config,
}) => {
  const [selectedBar, setSelectedBar] = useState<string | null>(null);

  // Determine if we should show all labels or sample them
  const shouldSampleLabels = data.length > 10;

  // Handle bar click
  const handleBarClick = (entry: any) => {
    setSelectedBar(entry.name);
    console.log('Bar clicked:', entry);
  };

  // Custom tick component to show fewer labels if needed
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload, index } = props;

    // Show every nth label if too many data points
    if (shouldSampleLabels) {
      const step = Math.ceil(data.length / 8); // Show ~8 labels max
      if (index % step !== 0 && index !== data.length - 1) {
        return null; // Skip this label
      }
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#6b7280"
          fontSize={11}
          transform="rotate(-45)"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'white',
        borderRadius: 2,
        border: 1,
        borderColor: 'grey.200',
        p: 3,
        mt: 2,
      }}
    >
      {config.title && (
        <Typography variant="h6" fontWeight={600} color="grey.800" mb={3}>
          {config.title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={data}
          margin={{ top: 30, right: 40, left: 60, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            height={100}
            tick={<CustomXAxisTick />}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{
              value: config.yAxis || '',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#374151', fontWeight: 500, fontSize: 14 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#1f2937', fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '30px' }}
            iconType="circle"
          />
          <Bar
            dataKey="value"
            fill={COLORS[0]}
            radius={[8, 8, 0, 0]}
            name={config.yAxis || 'Value'}
            onClick={handleBarClick}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={selectedBar === entry.name ? COLORS[4] : COLORS[0]}
                opacity={selectedBar && selectedBar !== entry.name ? 0.5 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Pie Chart Component
const PieChartComponent: React.FC<{ data: any[]; config: any }> = ({
  data,
  config,
}) => {
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  // Custom label with percentages
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${entry.name}: ${percent}%`;
  };

  // Handle slice click
  const handlePieClick = (data: any, index: number) => {
    setSelectedSlice(index === selectedSlice ? null : index);
    console.log('Pie slice clicked:', data);
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'white',
        borderRadius: 2,
        border: 1,
        borderColor: 'grey.200',
        p: 3,
        mt: 2,
      }}
    >
      {config.title && (
        <Typography variant="h6" fontWeight={600} color="grey.800" mb={3}>
          {config.title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={450}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine
            label={renderLabel}
            outerRadius={140}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            onClick={handlePieClick}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                opacity={selectedSlice !== null && selectedSlice !== index ? 0.5 : 1}
                style={{
                  transform: selectedSlice === index ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: any) => {
              const percent = ((value / total) * 100).toFixed(1);
              return [`${value} (${percent}%)`, 'Value'];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={50}
            iconType="circle"
            wrapperStyle={{ paddingTop: '30px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Line Chart Component
const LineChartComponent: React.FC<{
  data: any[];
  config: any;
  isScatter?: boolean;
}> = ({ data, config, isScatter = false }) => {
  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'white',
        borderRadius: 2,
        border: 1,
        borderColor: 'grey.200',
        p: 3,
        mt: 2,
      }}
    >
      {config.title && (
        <Typography variant="h6" fontWeight={600} color="grey.800" mb={3}>
          {config.title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={450}>
        <LineChart
          data={data}
          margin={{ top: 30, right: 40, left: 60, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="x"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{
              value: config.xAxis || '',
              position: 'insideBottom',
              offset: -15,
              style: { fill: '#374151', fontWeight: 500, fontSize: 14 },
            }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{
              value: config.yAxis || '',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#374151', fontWeight: 500, fontSize: 14 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#1f2937', fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '30px' }}
            iconType="circle"
          />
          <Line
            type={isScatter ? 'monotone' : 'monotone'}
            dataKey="y"
            stroke={COLORS[0]}
            strokeWidth={2}
            dot={{
              fill: COLORS[0],
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              fill: COLORS[0],
            }}
            name={config.yAxis || 'Value'}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Table Component
const TableComponent: React.FC<{ data: any[]; config: any; onExport: () => void; onExportImage: () => void }> = ({
  data,
  config,
  onExport,
  onExportImage,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExportCSV = () => {
    handleMenuClose();
    onExport();
  };

  const handleExportImage = () => {
    handleMenuClose();
    onExportImage();
  };
  // Extract column names from first row
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  if (columns.length === 0) {
    return (
      <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography color="text.secondary">No columns to display</Typography>
      </Box>
    );
  }

  // Format cell value
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toLocaleDateString();
      return JSON.stringify(value);
    }
    if (typeof value === 'number') {
      // Format numbers with commas
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        mt: 2,
      }}
    >
      {config.title && (
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            {config.title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            title="Download options"
            sx={{
              bgcolor: 'primary.50',
              '&:hover': { bgcolor: 'primary.100' },
            }}
          >
            <Download fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleExportImage}>
              <ListItemIcon>
                <ImageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download as Image (PNG)</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleExportCSV}>
              <ListItemIcon>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download Data (CSV)</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      )}
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: 600,
                    bgcolor: 'grey.100',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                hover
                sx={{
                  '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={`${rowIndex}-${column}`}
                    sx={{
                      whiteSpace: 'nowrap',
                      fontSize: '0.875rem',
                    }}
                  >
                    {formatValue(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          px: 3,
          py: 1.5,
          bgcolor: 'grey.50',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {data.length} {data.length === 1 ? 'row' : 'rows'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ChartRenderer;
