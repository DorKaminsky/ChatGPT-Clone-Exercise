'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import { ExpandMore, TableChart, Assessment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { DataSchema } from '@/lib/types';

interface DataPreviewProps {
  schema: DataSchema;
  preview: any[];
}

export default function DataPreview({ schema, preview }: DataPreviewProps) {
  const [expanded, setExpanded] = useState(true);

  // Calculate basic statistics
  const stats = {
    rows: schema.rowCount,
    columns: schema.columns.length,
    numericColumns: schema.columns.filter(c => c.type === 'number').length,
    textColumns: schema.columns.filter(c => c.type === 'string').length,
    dateColumns: schema.columns.filter(c => c.type === 'date').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        sx={{
          borderRadius: 2,
          mb: 3,
          '&:before': { display: 'none' },
          boxShadow: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: expanded ? '8px 8px 0 0' : 2,
            '& .MuiAccordionSummary-expandIconWrapper': {
              color: 'white',
            },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <TableChart />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                📊 Data Preview
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {stats.rows.toLocaleString()} rows • {stats.columns} columns
              </Typography>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ p: 3 }}>
          {/* Statistics Cards */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              📈 Quick Statistics
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              <Paper elevation={0} sx={{ px: 2, py: 1, bgcolor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Rows
                </Typography>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {stats.rows.toLocaleString()}
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ px: 2, py: 1, bgcolor: 'success.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Columns
                </Typography>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  {stats.columns}
                </Typography>
              </Paper>

              {stats.numericColumns > 0 && (
                <Paper elevation={0} sx={{ px: 2, py: 1, bgcolor: 'info.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Numeric Columns
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="info.main">
                    {stats.numericColumns}
                  </Typography>
                </Paper>
              )}

              {stats.textColumns > 0 && (
                <Paper elevation={0} sx={{ px: 2, py: 1, bgcolor: 'warning.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Text Columns
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="warning.main">
                    {stats.textColumns}
                  </Typography>
                </Paper>
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Column Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              📋 Columns
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              {schema.columns.map((col) => (
                <Chip
                  key={col.name}
                  label={`${col.name} (${col.type})`}
                  size="small"
                  variant="outlined"
                  icon={<Assessment sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 1.5,
                    fontWeight: 500,
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Data Table */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              👀 Sample Data (First {Math.min(preview.length, 20)} Rows)
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                mt: 1.5,
                maxHeight: 400,
                borderRadius: 2,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: 'grey.100',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderBottom: 2,
                        borderColor: 'primary.main',
                      }}
                    >
                      #
                    </TableCell>
                    {schema.columns.map((col) => (
                      <TableCell
                        key={col.name}
                        sx={{
                          bgcolor: 'grey.100',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          borderBottom: 2,
                          borderColor: 'primary.main',
                          minWidth: 120,
                        }}
                      >
                        <Box>
                          <Typography variant="caption" fontWeight={600}>
                            {col.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: 'text.secondary',
                              fontSize: '0.65rem',
                            }}
                          >
                            {col.type}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.slice(0, 20).map((row, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        '&:nth-of-type(odd)': {
                          bgcolor: 'grey.50',
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                        }}
                      >
                        {idx + 1}
                      </TableCell>
                      {schema.columns.map((col) => (
                        <TableCell
                          key={col.name}
                          sx={{
                            fontSize: '0.813rem',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row[col.name] !== null && row[col.name] !== undefined
                            ? String(row[col.name])
                            : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {preview.length > 20 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1, textAlign: 'center' }}
              >
                Showing first 20 of {schema.rowCount.toLocaleString()} rows
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </motion.div>
  );
}
