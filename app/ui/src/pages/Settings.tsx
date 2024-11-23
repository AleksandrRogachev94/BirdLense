import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { SettingsForm } from '../components/SettingsForm';
import { fetchSettings, updateSettings } from '../api/api';

interface Settings {
  secrets: {
    openweather_api_key: string;
    latitude: string;
    longitude: string;
    zip?: string;
  };
  web: {
    host: string;
    port: number;
  };
  processor: {
    video_width: number;
    video_height: number;
    tracker: string;
    max_record_seconds: number;
    max_inactive_seconds: number;
    save_images: boolean;
  };
}

export const Settings: React.FC = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });
  const updateMutation = useMutation({ mutationFn: updateSettings });

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
        currentSettings={settings as Settings}
        onSubmit={updateMutation.mutate}
      />
    </Container>
  );
};
