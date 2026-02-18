'use client';

import { useState } from 'react';
import { Box, Paper, Avatar, Typography, IconButton, Tooltip } from '@mui/material';
import { Person, SmartToy, ContentCopy, Check } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Message as MessageType } from '@/lib/types';
import ChartRenderer from './ChartRenderer';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Simple markdown rendering for bold and lists
  const renderContent = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        return (
          <li key={index} style={{ marginLeft: 20 }}>
            {renderInlineFormatting(content)}
          </li>
        );
      }

      // Handle numbered lists
      const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
      if (numberedMatch) {
        return (
          <li key={index} style={{ marginLeft: 20, listStyleType: 'decimal' }}>
            {renderInlineFormatting(numberedMatch[1])}
          </li>
        );
      }

      // Regular line
      return line.trim() ? (
        <Typography key={index} variant="body2" component="span" display="block">
          {renderInlineFormatting(line)}
        </Typography>
      ) : (
        <br key={index} />
      );
    });
  };

  // Render bold text (**text**)
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          gap: 2,
          mb: 3,
        }}
      >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          background: isUser
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        }}
      >
        {isUser ? <Person sx={{ fontSize: 20 }} /> : <SmartToy sx={{ fontSize: 20 }} />}
      </Avatar>

      {/* Message Content */}
      <Box sx={{ maxWidth: '80%', position: 'relative' }}>
        {/* Copy Button - Only for AI messages */}
        {!isUser && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              zIndex: 1,
            }}
          >
            <Tooltip title={copied ? "Copied!" : "Copy response"} arrow>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                  },
                }}
              >
                {copied ? (
                  <Check sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <ContentCopy sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Paper
          elevation={1}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 3,
            background: isUser
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : '#f3f4f6',
            color: isUser ? 'white' : 'text.primary',
          }}
        >
          <Box sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            {renderContent(message.content)}
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              opacity: 0.7,
              fontSize: '0.75rem',
            }}
          >
            {timestamp}
          </Typography>
        </Paper>

        {/* Chart Visualization */}
        {message.visualization && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Box sx={{ mt: 2 }}>
              <ChartRenderer chartData={message.visualization} />
            </Box>
          </motion.div>
        )}
      </Box>
    </Box>
    </motion.div>
  );
}
