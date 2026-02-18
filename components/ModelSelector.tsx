'use client';

import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Sparkles } from 'lucide-react';
import type { ModelInfo } from '@/lib/types';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.models || []);

      // Set default model if not already selected
      if (!selectedModel && data.defaultModel) {
        onModelChange(data.defaultModel);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Box sx={{ fontSize: 14, color: 'text.secondary' }}>Loading models...</Box>
      </Box>
    );
  }

  if (error || models.length === 0) {
    return (
      <Chip
        icon={<Sparkles size={16} />}
        label="Model unavailable"
        color="error"
        size="small"
      />
    );
  }

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <Select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        startAdornment={
          <Sparkles size={16} style={{ marginRight: 8, color: '#9333ea' }} />
        }
        sx={{
          backgroundColor: 'white',
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            py: 1,
          }
        }}
      >
        {models.map((model) => (
          <MenuItem key={model.id} value={model.id}>
            <Box sx={{ py: 0.5 }}>
              <Box sx={{ fontWeight: 500, fontSize: 14 }}>{model.name}</Box>
              <Box sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25, whiteSpace: 'normal' }}>
                {model.description}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
