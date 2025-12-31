import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs, { Dayjs } from 'dayjs';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { BASE_API_URL } from '../../api/api';

interface StorageStats {
  date: string;
  fileCount: number;
  totalSize: number;
}

// Update the chart data point type to allow string indexing
interface ChartDataPoint {
  [key: string]: string | number; // This allows for dynamic property access
  date: string;
  size: number;
}

interface PurgeResponse {
  message: string;
  deletedCount: number;
  deletedSize: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const StorageManagement = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PurgeResponse | null>(null);

  const {
    data: storageStats,
    isLoading,
    refetch,
  } = useQuery<StorageStats[]>({
    queryKey: ['storageStats'],
    queryFn: async () => {
      const { data } = await axios.get<StorageStats[]>(
        `${BASE_API_URL}/storage/stats`,
      );
      return data;
    },
  });

  const purgeVideosMutation = useMutation<PurgeResponse, Error, Dayjs>({
    mutationFn: async (date) => {
      const { data } = await axios.post<PurgeResponse>(
        `${BASE_API_URL}/storage/purge`,
        {
          date: date.format('YYYY-MM-DD'),
        },
      );
      return data;
    },
    onSuccess: (data) => {
      setSelectedDate(null);
      setSuccess(data);
      refetch();
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (error) => {
      setError(
        error instanceof Error ? error.message : 'Failed to purge videos',
      );
    },
  });

  const handlePurge = (): void => {
    if (!selectedDate) return;

    if (
      window.confirm(
        `Are you sure you want to delete all recordings on or before ${selectedDate.format('YYYY-MM-DD')}? This action cannot be undone.`,
      )
    ) {
      setSuccess(null);
      purgeVideosMutation.mutate(selectedDate);
    }
  };

  if (isLoading) {
    return <Typography>Loading storage statistics...</Typography>;
  }

  const chartData: ChartDataPoint[] =
    storageStats?.map((stat) => ({
      date: dayjs(stat.date).format('MM/DD'),
      size: Number((stat.totalSize / (1024 * 1024)).toFixed(2)),
    })) || [];

  const totalSize: number =
    storageStats?.reduce((acc, stat) => acc + stat.totalSize, 0) || 0;
  const totalFiles: number =
    storageStats?.reduce((acc, stat) => acc + stat.fileCount, 0) || 0;

  return (
    <Box sx={{ pb: 2 }}>
      <Typography variant="h5" gutterBottom>
        Storage Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          <AlertTitle>Success</AlertTitle>
          Deleted {success.deletedCount} files (
          {formatBytes(success.deletedSize)})
        </Alert>
      )}

      <Stack spacing={3}>
        <Stack direction="row" spacing={3}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Total Storage
                </Typography>
                <Typography variant="h5">{formatBytes(totalSize)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Total Files
                </Typography>
                <Typography variant="h5">{totalFiles}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Purge Old Recordings
            </Typography>
            <Stack direction="row" spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Delete before date"
                  value={selectedDate}
                  onChange={(newValue: Dayjs | null) =>
                    setSelectedDate(newValue)
                  }
                  maxDate={dayjs()}
                  slotProps={{
                    textField: { size: 'small', sx: { flex: 1 } },
                  }}
                />
              </LocalizationProvider>
              <Button
                variant="contained"
                color="error"
                disabled={!selectedDate || purgeVideosMutation.isPending}
                onClick={handlePurge}
                startIcon={<DeleteOutlineIcon />}
              >
                Purge
              </Button>
            </Stack>
          </Paper>
        </Stack>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Storage Usage Over Time
          </Typography>
          {chartData.length > 0 ? (
            <Box sx={{ width: '100%', height: 400 }}>
              <BarChart
                dataset={chartData}
                series={[
                  {
                    dataKey: 'size',
                    label: 'Storage (MB)',
                    color: '#2dd4bf',
                    valueFormatter: (value) => `${value} MB`,
                  },
                ]}
                xAxis={[
                  {
                    dataKey: 'date',
                    scaleType: 'band',
                  },
                ]}
                yAxis={[
                  {
                    label: 'Storage (MB)',
                  },
                ]}
                height={350}
              />
            </Box>
          ) : (
            <Typography color="text.secondary">
              No storage data available
            </Typography>
          )}
        </Paper>
      </Stack>
    </Box>
  );
};
