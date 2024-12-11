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
import Timer from '@mui/icons-material/Timer';
import AccessTime from '@mui/icons-material/AccessTime';
import VideoSettings from '@mui/icons-material/VideoSettings';
import { PageHelp } from '../../components/PageHelp';
import { overviewHelpConfig } from '../../page-help-config';

const formatHour = (hour: number) => {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
};

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

  const ratio =
    (overviewData?.stats.audioDuration || 0) /
    (overviewData?.stats.videoDuration || 1);

  return (
    <Box>
      <Grid
        container
        sx={{ pb: 4 }}
        spacing={3}
        justifyContent="space-between"
        alignItems="center"
      >
        {/* Header */}
        <Grid size={{ xs: 12, sm: 8 }}>
          <PageHelp {...overviewHelpConfig} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={selectedDay}
              onChange={(newValue) => setSelectedDay(newValue as Dayjs)}
              disableFuture
              format="YYYY-MM-DD"
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

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
                icon={AccessTime}
                title="Last Hour"
                value={overviewData?.stats.lastHourDetections || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={Timer}
                title="Average Visit"
                value={`${Math.round(overviewData?.stats.avgVisitDuration || 0)} sec`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={AccessTime}
                title="Busiest Hour"
                value={formatHour(overviewData?.stats.busiestHour || 0)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={VideoSettings}
                title="Audio/Video Ratio"
                value={ratio.toFixed(2)}
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
          <Paper>
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
