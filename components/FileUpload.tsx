'use client';

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Description
} from '@mui/icons-material';
import type { UploadResponse } from '@/lib/types';
import { LOADING_MESSAGES } from '@/lib/loading-messages';

interface FileUploadProps {
  onUploadSuccess?: (response: UploadResponse) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle through upload loading messages
  useEffect(() => {
    if (!isUploading) {
      setLoadingMessage('');
      return;
    }

    const messages = LOADING_MESSAGES.upload;
    let index = 0;
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 1500);

    return () => clearInterval(interval);
  }, [isUploading]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploadedData(null);

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    if (file.size === 0) {
      setError('File is empty. Please upload a valid Excel file.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/data/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadedData(data);
      onUploadSuccess?.(data);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Success state
  if (uploadedData) {
    return (
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Success Header */}
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
              <Box>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  File Uploaded Successfully!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your data is ready to analyze
                </Typography>
              </Box>
            </Stack>

            <Divider />

            {/* File Info */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Description color="primary" />
                <Typography variant="body1" fontWeight={500}>
                  {uploadedData.fileName}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Rows
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {uploadedData.schema.rowCount.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Columns
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {uploadedData.schema.columns.length}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Divider />

            {/* Columns */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                Detected Columns
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {uploadedData.schema.columns.map((col, idx) => (
                  <Chip
                    key={idx}
                    label={`${col.name} (${col.type})`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>

            {/* Preview Table */}
            {uploadedData.preview && uploadedData.preview.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                  Data Preview (First 5 Rows)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {uploadedData.schema.columns.map((col, idx) => (
                          <TableCell key={idx} sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
                            {col.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uploadedData.preview.map((row, rowIdx) => (
                        <TableRow key={rowIdx} hover>
                          {uploadedData.schema.columns.map((col, colIdx) => (
                            <TableCell key={colIdx}>
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
              </Box>
            )}

            {/* Upload New Button */}
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={handleReset}
              fullWidth
              size="large"
            >
              Upload New File
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Upload state
  return (
    <Card
      elevation={isDragging ? 8 : 2}
      sx={{
        borderRadius: 3,
        transition: 'all 0.3s ease',
        border: isDragging ? 2 : 1,
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderStyle: 'dashed',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {isUploading ? (
          // Loading State
          <Stack spacing={3} alignItems="center" py={4}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="primary" fontWeight={600}>
              {loadingMessage || 'Processing...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take a few moments
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Drop Zone */}
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
              sx={{
                cursor: 'pointer',
                textAlign: 'center',
                py: 3,
                px: 3,
                borderRadius: 2,
                bgcolor: isDragging ? 'primary.light' : 'grey.50',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              <CloudUpload
                sx={{
                  fontSize: 60,
                  color: isDragging ? 'primary.main' : 'grey.400',
                  mb: 2
                }}
              />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {isDragging ? 'Drop your file here' : 'Drag & Drop your Excel file'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                or click to browse
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Chip label=".xlsx" size="small" variant="outlined" />
                <Chip label=".xls" size="small" variant="outlined" />
              </Stack>
            </Box>

            <Divider>
              <Typography variant="caption" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* Browse Button */}
            <Button
              variant="contained"
              size="large"
              startIcon={<InsertDriveFile />}
              onClick={handleClick}
              fullWidth
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)',
                }
              }}
            >
              Choose File
            </Button>

            {/* Info Text */}
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Maximum file size: 10MB • Supported formats: Excel (.xlsx, .xls)
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
