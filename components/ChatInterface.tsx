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
  Alert,
  Fade,
  Tooltip,
  Chip
} from '@mui/material';
import { Send, FlashOn, FlashOff } from '@mui/icons-material';
import { Message as MessageType, DataSchema, ChatRequest, ChatResponse } from '@/lib/types';
import Message from './Message';
import ModelSelector from './ModelSelector';
import EmptyState from './EmptyState';
import { LOADING_MESSAGES, type LoadingStage } from '@/lib/loading-messages';

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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStage, setLoadingStage] = useState<LoadingStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-5');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle through loading messages
  useEffect(() => {
    if (!loadingStage) {
      setLoadingMessage('');
      return;
    }

    const messages = LOADING_MESSAGES[loadingStage];
    let index = 0;
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadingStage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Streaming handler
  const handleStreamingSubmit = async (query: string) => {
    setIsLoading(true);
    setLoadingStage('analyzing');

    try {
      const request: ChatRequest = {
        query,
        dataSourceId,
        conversationContext: messages.slice(-5).map((m) => m.content),
        model: selectedModel,
      };

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.statusText}`);
      }

      // Create placeholder message for streaming
      const messageId = (Date.now() + 1).toString();
      const aiMessage: MessageType = {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Read stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setLoadingMessage(data.message);
              } else if (data.type === 'text') {
                accumulatedText += data.content;
                // Update message with accumulated text
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId ? { ...msg, content: accumulatedText } : msg
                  )
                );
              } else if (data.type === 'visualization') {
                // Add visualization to message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId ? { ...msg, visualization: data.data } : msg
                  )
                );
              } else if (data.type === 'done') {
                setIsLoading(false);
                setLoadingStage(null);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoadingStage(null);

      // Add error message to chat
      const errorMessage: MessageType = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  // Regular (non-streaming) handler
  const handleRegularSubmit = async (query: string) => {
    setIsLoading(true);
    setLoadingStage('analyzing');

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

      setLoadingStage('generating');

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
      setLoadingStage(null);

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
      setLoadingStage(null);
    }
  };

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

    // Choose streaming or regular mode
    if (streamingEnabled) {
      await handleStreamingSubmit(query);
    } else {
      await handleRegularSubmit(query);
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={streamingEnabled ? 'Streaming mode: responses appear word-by-word' : 'Regular mode: complete response at once'}>
              <Chip
                icon={streamingEnabled ? <FlashOn /> : <FlashOff />}
                label={streamingEnabled ? 'Streaming' : 'Regular'}
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              />
            </Tooltip>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </Stack>
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
          <EmptyState
            icon="💬"
            title="Ready to analyze your data!"
            description="Ask a question about your data to get started. Try asking about trends, comparisons, or specific data points."
          />
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isLoading && (
              <Fade in>
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
                        {loadingMessage || 'Processing...'}
                      </Typography>
                    </Stack>
                  </Paper>
                </Box>
              </Fade>
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
