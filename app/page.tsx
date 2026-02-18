'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Stack,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Upload,
  AutoAwesome,
  TrendingUp,
  PieChart,
  BarChart,
  Insights,
  PlayArrow
} from '@mui/icons-material';
import FileUpload from '@/components/FileUpload';
import ChatInterface from '@/components/ChatInterface';
import SuccessConfetti from '@/components/SuccessConfetti';
import type { UploadResponse } from '@/lib/types';

export default function Home() {
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);
  const [fillQuery, setFillQuery] = useState<((query: string) => void) | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadedData(data);
    setShowConfetti(true);
  };

  const loadSampleData = async () => {
    try {
      setLoadingSample(true);

      // Fetch the sample file
      const response = await fetch('/sample-sales-data.xlsx');
      const blob = await response.blob();
      const file = new File([blob], 'sample-sales-data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Upload it
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/data/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to load sample data');
      }

      const data = await uploadResponse.json();
      handleUploadSuccess(data);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      alert('Failed to load sample data. Please try uploading your own file.');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleExampleClick = (query: string) => {
    if (fillQuery) {
      fillQuery(query);
    }
  };

  // Example queries to display
  const exampleQueries = [
    {
      icon: TrendingUp,
      text: 'Which product has top sales?',
      color: 'primary' as const,
    },
    {
      icon: PieChart,
      text: 'Show me sales by region now',
      color: 'secondary' as const,
    },
    {
      icon: BarChart,
      text: 'What is the trend over time?',
      color: 'primary' as const,
    },
    {
      icon: AutoAwesome,
      text: 'Show orders above $5000 now',
      color: 'secondary' as const,
    },
  ];

  return (
    <>
      <SuccessConfetti show={showConfetti} />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f3e8ff 0%, #ffffff 50%, #dbeafe 100%)',
          py: 6
        }}
      >
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Chip
            icon={<AutoAwesome sx={{ fontSize: 16 }} />}
            label="Powered by Claude AI"
            color="primary"
            variant="outlined"
            sx={{ mb: 3, fontWeight: 600 }}
          />
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Turn Data into Insights
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}
          >
            Upload your Excel files and ask questions in plain English.
            Get instant answers with beautiful visualizations.
          </Typography>
        </Box>

        {/* Main Content */}
        {!uploadedData ? (
          /* Empty State - No file uploaded */
          <Stack spacing={8} alignItems="center">
            {/* File Upload Section - Centered */}
            <Box sx={{ width: '100%', maxWidth: 800 }}>
              <Typography variant="h5" fontWeight={600} textAlign="center" mb={4}>
                Upload Your Data
              </Typography>
              <FileUpload onUploadSuccess={handleUploadSuccess} />

              {/* Sample Data Button */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Don't have data? Try our sample dataset
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={loadingSample ? <CircularProgress size={16} /> : <PlayArrow />}
                  onClick={loadSampleData}
                  disabled={loadingSample}
                  size="large"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 4,
                  }}
                >
                  {loadingSample ? 'Loading Sample Data...' : 'Try with Sample Data'}
                </Button>
              </Box>
            </Box>

            {/* Example Queries - 2x2 Grid */}
            <Box sx={{ width: '100%', maxWidth: 900 }}>
              <Typography variant="h5" fontWeight={600} textAlign="center" mb={4}>
                Example Questions You Can Ask
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 3,
                }}
              >
                {exampleQueries.map((example, index) => {
                  const Icon = example.icon;
                  return (
                    <Card
                      key={index}
                      elevation={1}
                      sx={{
                        height: 120,
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        }
                      }}
                    >
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                background: example.color === 'primary'
                                  ? 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)'
                                  : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Typography
                              variant="body1"
                              fontWeight={500}
                              sx={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {example.text}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                  );
                })}
              </Box>
            </Box>

            {/* Features - Centered */}
            <Box sx={{ width: '100%', maxWidth: 900 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                  <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <TrendingUp sx={{ color: 'white', fontSize: 32 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Smart Analysis
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        AI-powered insights from your data
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <PieChart sx={{ color: 'white', fontSize: 32 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Auto Visualizations
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Charts generated automatically
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <AutoAwesome sx={{ color: 'white', fontSize: 32 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Natural Language
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ask questions in plain English
                      </Typography>
                    </CardContent>
                  </Card>
              </Box>
            </Box>
          </Stack>
        ) : (
          /* Chat Interface - File uploaded */
          <Box>
            {/* File Info Banner */}
            <Paper
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #f3e8ff 0%, #dbeafe 100%)',
                p: 2,
                mb: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.light',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Insights sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {uploadedData.fileName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {uploadedData.schema.rowCount.toLocaleString()} rows • {uploadedData.schema.columns.length} columns
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setUploadedData(null)}
                >
                  Upload new file
                </Button>
              </Stack>
            </Paper>

            {/* Example Query Chips */}
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                Try asking:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {exampleQueries.map((example, index) => (
                  <Chip
                    key={index}
                    label={example.text}
                    variant="outlined"
                    onClick={() => handleExampleClick(example.text)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(124, 58, 237, 0.08)',
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Chat Interface */}
            <Box sx={{ height: 600 }}>
              <ChatInterface
                dataSourceId={uploadedData.dataSourceId}
                schema={uploadedData.schema}
                preview={uploadedData.preview}
                onQuerySuggestionClick={(handler) => setFillQuery(() => handler)}
              />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
    </>
  );
}
