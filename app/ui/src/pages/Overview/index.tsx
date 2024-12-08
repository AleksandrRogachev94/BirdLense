import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchOverviewData, fetchWeather } from '../../api/api';
import { WeatherCard } from '../../components/WeatherCard';
import { StatCard } from '../../components/StatCard';
import DailyPatternChart from './DailyPatternChart';
import Pets from '@mui/icons-material/Pets';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Videocam from '@mui/icons-material/Videocam';
import Audiotrack from '@mui/icons-material/Audiotrack';

export const Overview = () => {
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());

  const {
    data: overviewData,
    isLoading: isLoadingSightings,
    error: errorSightings,
  } = useQuery({
    queryKey: ['overview', selectedDay?.format('YYYY-MM-DD')],
    queryFn: () => fetchOverviewData(selectedDay?.format('YYYY-MM-DD') || ''),
    enabled: !!selectedDay,
  });

  const { data: weather, error: errorWeather } = useQuery({
    queryKey: ['weather'],
    queryFn: () => fetchWeather(),
  });

  if (isLoadingSightings)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (errorSightings || errorWeather) return <div>Error loading data.</div>;

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">Bird Activity Overview</Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={selectedDay}
            onChange={(newValue) => setSelectedDay(newValue as Dayjs)}
            disableFuture
            format="YYYY-MM-DD"
          />
        </LocalizationProvider>
      </Box>

      <Grid container spacing={3} sx={{ minHeight: '300px' }}>
        {/* Stats Cards */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={Pets}
                title="Unique Species"
                value={overviewData?.stats.uniqueSpecies || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={TrendingUp}
                title="Total Detections"
                value={overviewData?.stats.totalDetections || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={Pets}
                title="Last Hour"
                value={overviewData?.stats.lastHourDetections || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <StatCard
                icon={Videocam}
                title="Video Detections"
                value={overviewData?.stats.videoDetections || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <StatCard
                icon={Audiotrack}
                title="Audio Detections"
                value={overviewData?.stats.audioDetections || 0}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Weather Card */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
          {weather && <WeatherCard weather={weather} />}
        </Grid>

        {/* Daily Pattern Chart */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Activity Pattern
            </Typography>
            {overviewData?.topSpecies && (
              <DailyPatternChart
                data={overviewData.topSpecies}
                date={selectedDay}
                size={800}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Overview;
