import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchDailySummary } from '../../api/api';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Dayjs } from 'dayjs';

interface DailySummaryProps {
  date: Dayjs;
}

export const DailySummary = ({ date }: DailySummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);

  // Reset summary when date changes
  useEffect(() => {
    setSummary(null);
  }, [date]);

  const mutation = useMutation({
    mutationFn: (dateStr: string) => fetchDailySummary(dateStr),
    onSuccess: (data) => {
      setSummary(data.summary);
    },
  });

  const handleGenerate = () => {
    mutation.mutate(date.format('YYYY-MM-DD'));
  };

  return (
    <Paper
      sx={{
        p: 2,
        width: '100%',
        height: '100%',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Daily AI Summary</Typography>
        <AutoAwesomeIcon color="primary" />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: summary ? 'flex-start' : 'center',
          alignItems: summary ? 'flex-start' : 'center',
        }}
      >
        {mutation.isPending ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
          >
            <CircularProgress />
          </Box>
        ) : summary ? (
          <Box sx={{ width: '100%' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {summary}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleGenerate}
              startIcon={<AutoAwesomeIcon />}
              fullWidth
            >
              Regenerate
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generate a summary of bird visits for {date.format('MMM D, YYYY')}{' '}
              using Gemini AI.
            </Typography>
            <Button
              variant="contained"
              onClick={handleGenerate}
              startIcon={<AutoAwesomeIcon />}
            >
              Generate Summary
            </Button>
          </Box>
        )}
        {mutation.isError && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Error generating summary. Please try again.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
