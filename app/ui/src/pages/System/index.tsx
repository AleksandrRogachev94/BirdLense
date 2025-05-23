import React from 'react';
import { SystemActivity } from './SystemActivity';
import { SystemMonitor } from './SystemMonitor';
import { Box, Divider } from '@mui/material';
import { StorageManagement } from './StorageManagement';

export const System: React.FC = () => {
  return (
    <Box>
      <Box>
        <SystemMonitor />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <SystemActivity />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <StorageManagement />
      </Box>
    </Box>
  );
};
