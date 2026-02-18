'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Stack,
  Alert
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { Message as MessageType, DataSchema, ChatRequest, ChatResponse } from '@/lib/types';
import Message from './Message';
import ModelSelector from './ModelSelector';

interface ChatInterfaceProps {
  dataSourceId: string;
  schema: DataSchema;
  preview: any[];
  onQuerySuggestionClick?: (query: string) => void;
}

export default function ChatInterface({
  dataSourceId,
  schema,
  preview,
  onQuerySuggestionClick,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-5');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setError(null);

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const request: ChatRequest = {
        query,
        dataSourceId,
        conversationContext: messages.slice(-5).map((m) => m.content),
        model: selectedModel,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get response: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.textResponse,
        visualization: data.visualization,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'An error occurred. Please try again.');

      // Add error message to chat
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Expose method to set input value from parent
  const handleSuggestionClick = useCallback((query: string) => {
    setInputValue(query);
    inputRef.current?.focus();
  }, []);

  // Call parent callback when component mounts
  useEffect(() => {
    if (onQuerySuggestionClick) {
      onQuerySuggestionClick(handleSuggestionClick);
    }
  }, [onQuerySuggestionClick, handleSuggestionClick]);

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
          px: 3,
          py: 2,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Chat with your data
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {schema.rowCount.toLocaleString()} rows • {schema.columns.length} columns
            </Typography>
          </Box>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          backgroundColor: '#f9fafb',
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
            }}
          >
            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Ready to analyze your data!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ask a question about your data to get started
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box sx={{ width: 36 }} /> {/* Spacer for alignment */}
                <Paper
                  elevation={1}
                  sx={{
                    px: 3,
                    py: 2,
                    borderRadius: 3,
                    background: '#f3f4f6',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Analyzing your data...
                    </Typography>
                  </Stack>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'white',
        }}
      >
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your data..."
            disabled={isLoading}
            variant="outlined"
            size="small"
            inputRef={inputRef}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <IconButton
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            color="primary"
            sx={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)',
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af',
              },
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : <Send />}
          </IconButton>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Press Enter to send, Shift + Enter for new line
        </Typography>
      </Box>
    </Paper>
  );
}
