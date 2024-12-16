import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { SettingsForm } from './SettingsForm';
import {
  fetchBirdFamilies,
  fetchSettings,
  updateSettings,
} from '../../api/api';
import { Settings as SettingsType } from '../../types';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [showSuccessAlert, setShowSuccessAlert] = React.useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const { data: birdFamilies = [], isLoading: isLoadingBirdFamilies } =
    useQuery({
      queryKey: ['birdFamilies'],
      queryFn: fetchBirdFamilies,
    });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowSuccessAlert(true);
    },
  });

  if (isLoading || isLoadingBirdFamilies)
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
      <Alert severity="info" sx={{ mb: 3 }}>
        Some settings changes require a system restart to take effect. After
        saving, please restart the system.
      </Alert>
      <SettingsForm
        currentSettings={settings as SettingsType}
        birdFamilies={birdFamilies}
        onSubmit={updateMutation.mutate}
      />
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={6000}
        onClose={() => setShowSuccessAlert(false)}
      >
        <Alert
          onClose={() => setShowSuccessAlert(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Settings saved successfully. Please restart the system for changes to
          take effect.
        </Alert>
      </Snackbar>
    </Container>
  );
};
