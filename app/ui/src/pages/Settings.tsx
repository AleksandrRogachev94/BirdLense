import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { SettingsForm } from '../components/SettingsForm';
import { fetchSettings, updateSettings } from '../api/api';
import { Settings as SettingsType } from '../types';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Container maxWidth="md" sx={{ pb: 5 }}>
      <Typography variant="h4" gutterBottom>
        Update Settings
      </Typography>
      <SettingsForm
        currentSettings={settings as SettingsType}
        onSubmit={updateMutation.mutate}
      />
    </Container>
  );
};
