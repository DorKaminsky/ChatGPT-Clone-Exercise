'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Skeleton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Lightbulb,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { DataSchema } from '@/lib/types';

interface SmartInsightsProps {
  schema: DataSchema;
  preview: any[];
  dataSourceId: string;
}

interface Insight {
  type: 'trend' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'warning' | 'success' | 'info';
}

export default function SmartInsights({ schema, preview, dataSourceId }: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    generateInsights();
  }, [schema, preview]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema,
          preview,
          dataSourceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(parseInsights(data.insights));
    } catch (err: any) {
      console.error('Failed to generate insights:', err);
      setError(err.message);
      // Fallback to basic insights
      setInsights(generateBasicInsights());
    } finally {
      setLoading(false);
    }
  };

  const generateBasicInsights = (): Insight[] => {
    const basicInsights: Insight[] = [];

    // Data volume insight
    if (schema.rowCount > 1000) {
      basicInsights.push({
        type: 'success',
        title: 'Large Dataset',
        description: `Your dataset contains ${schema.rowCount.toLocaleString()} rows - excellent for detailed analysis!`,
        icon: <CheckCircle />,
        color: 'success',
      });
    } else if (schema.rowCount < 10) {
      basicInsights.push({
        type: 'warning',
        title: 'Small Dataset',
        description: `Only ${schema.rowCount} rows detected. Consider adding more data for better insights.`,
        icon: <Warning />,
        color: 'warning',
      });
    }

    // Column diversity
    const numericCols = schema.columns.filter(c => c.type === 'number').length;
    const textCols = schema.columns.filter(c => c.type === 'string').length;
    const dateCols = schema.columns.filter(c => c.type === 'date').length;

    if (numericCols > 0 && dateCols > 0) {
      basicInsights.push({
        type: 'trend',
        title: 'Time-Series Analysis Ready',
        description: `Found ${dateCols} date column(s) and ${numericCols} numeric column(s) - perfect for trend analysis!`,
        icon: <TrendingUp />,
        color: 'primary',
      });
    }

    if (textCols > numericCols * 2) {
      basicInsights.push({
        type: 'info',
        title: 'Text-Heavy Dataset',
        description: `${textCols} text columns detected. Consider asking categorical or distribution questions.`,
        icon: <Lightbulb />,
        color: 'info',
      });
    }

    // Null value check (basic from preview)
    const nullCount = preview.reduce((count, row) => {
      return count + Object.values(row).filter(val => val === null || val === undefined || val === '').length;
    }, 0);

    if (nullCount > preview.length * schema.columns.length * 0.1) {
      basicInsights.push({
        type: 'warning',
        title: 'Missing Values Detected',
        description: 'Some cells contain missing or null values. This may affect analysis accuracy.',
        icon: <Warning />,
        color: 'warning',
      });
    }

    // Column name insights
    const hasId = schema.columns.some(c => c.name.toLowerCase().includes('id'));
    const hasAmount = schema.columns.some(c =>
      c.name.toLowerCase().includes('amount') ||
      c.name.toLowerCase().includes('price') ||
      c.name.toLowerCase().includes('revenue') ||
      c.name.toLowerCase().includes('cost')
    );

    if (hasId && hasAmount) {
      basicInsights.push({
        type: 'success',
        title: 'Financial Data Detected',
        description: 'Your data appears to contain financial or transaction information - great for revenue analysis!',
        icon: <CheckCircle />,
        color: 'success',
      });
    }

    return basicInsights;
  };

  const parseInsights = (rawInsights: string): Insight[] => {
    // Parse AI-generated insights into structured format
    const parsed: Insight[] = [];

    // Split by lines and parse each insight
    const lines = rawInsights.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      // Clean up markdown formatting (remove ** for bold, remove numbered list markers)
      let cleanLine = line
        .replace(/^\*\*\d+\.\s*/, '') // Remove "**1. " at start
        .replace(/^\d+\.\s*/, '')      // Remove "1. " at start
        .replace(/\*\*/g, '')          // Remove all ** (bold markers)
        .trim();

      if (!cleanLine) return;

      // Try to detect insight type from keywords
      let type: Insight['type'] = 'info';
      let color: Insight['color'] = 'info';
      let icon = <Lightbulb />;

      const lowerLine = cleanLine.toLowerCase();
      if (lowerLine.includes('trend') || lowerLine.includes('increase') || lowerLine.includes('growth')) {
        type = 'trend';
        color = 'primary';
        icon = <TrendingUp />;
      } else if (lowerLine.includes('warning') || lowerLine.includes('missing') || lowerLine.includes('concern') || lowerLine.includes('issue')) {
        type = 'warning';
        color = 'warning';
        icon = <Warning />;
      } else if (lowerLine.includes('success') || lowerLine.includes('excellent') || lowerLine.includes('good') || lowerLine.includes('perfect')) {
        type = 'success';
        color = 'success';
        icon = <CheckCircle />;
      }

      // Extract title and description (split on first colon)
      const colonIndex = cleanLine.indexOf(':');
      if (colonIndex > 0) {
        const title = cleanLine.substring(0, colonIndex).trim();
        const description = cleanLine.substring(colonIndex + 1).trim();

        parsed.push({
          type,
          title,
          description,
          icon,
          color,
        });
      } else {
        // No colon found, use whole line as description
        parsed.push({
          type,
          title: 'Insight',
          description: cleanLine,
          icon,
          color,
        });
      }
    });

    return parsed.length > 0 ? parsed : generateBasicInsights();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
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
            <Lightbulb />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                💡 Smart Insights
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                AI-powered analysis of your data
              </Typography>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ p: 3 }}>
          {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Using basic insights. {error}
            </Alert>
          )}

          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Paper key={i} elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Stack spacing={1}>
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="80%" />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : insights.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={2}>
              No insights available at this time.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: `${insight.color}.50`,
                      borderLeft: 4,
                      borderColor: `${insight.color}.main`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          bgcolor: `${insight.color}.main`,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {insight.icon}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          {insight.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {insight.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </motion.div>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    </motion.div>
  );
}
