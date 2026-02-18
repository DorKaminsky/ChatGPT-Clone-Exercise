'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 3,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <Box
            sx={{
              fontSize: { xs: 60, sm: 80 },
              mb: 2,
              opacity: 0.7,
              lineHeight: 1,
            }}
          >
            {icon}
          </Box>
        </motion.div>

        <Typography
          variant="h5"
          fontWeight={600}
          gutterBottom
          sx={{ mt: 2 }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 400,
            mx: 'auto',
            mb: 3,
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>

        {action && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Box sx={{ mt: 2 }}>{action}</Box>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
}
