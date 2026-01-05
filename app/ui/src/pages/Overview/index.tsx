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
import { DailySummary } from './DailySummary';
import { SpeciesDistributionChart } from './SpeciesDistributionChart';
import { HourlyActivityChart } from './HourlyActivityChart';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import TimelapseOutlined from '@mui/icons-material/TimelapseOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import WbSunnyOutlined from '@mui/icons-material/WbSunnyOutlined';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';
import { BirdIcon } from '../../components/icons/BirdIcon';
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

  const formatRecordingTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    return `${(seconds / 3600).toFixed(1)} hrs`;
  };

  return (
    <Box sx={{ pb: 4 }}>
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

      <Grid container spacing={2} sx={{ minHeight: '300px' }}>
        {/* Stats Cards */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={BirdIcon}
                title="Unique Species"
                value={overviewData?.stats.uniqueSpecies || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={VisibilityOutlined}
                title="Total Visits"
                value={overviewData?.stats.totalDetections || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={ScheduleOutlined}
                title="Visits (Last Hour)"
                value={overviewData?.stats.lastHourDetections || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={TimelapseOutlined}
                title="Mean Visit Duration"
                value={`${Math.round(overviewData?.stats.avgVisitDuration || 0)} sec`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={WbSunnyOutlined}
                title="Busiest Hour"
                value={
                  (overviewData?.stats.totalDetections ?? 0) > 0
                    ? formatHour(overviewData?.stats.busiestHour ?? 0)
                    : 'N/A'
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                icon={VideocamOutlined}
                title="Recording Time"
                value={formatRecordingTime(
                  overviewData?.stats.videoDuration || 0,
                )}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Weather Card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
          {weather && <WeatherCard weather={weather} />}
        </Grid>

        {/* Daily Summary */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
          <DailySummary date={selectedDay} />
        </Grid>

        {/* Hourly Activity Line Chart */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Hourly Activity
            </Typography>
            {overviewData?.topSpecies && (
              <HourlyActivityChart
                data={overviewData.topSpecies}
                hourlyTemperature={overviewData.hourlyTemperature}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Daily Pattern Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 1, overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ px: 1 }} gutterBottom>
              Daily Activity Pattern
            </Typography>
            {overviewData?.topSpecies && (
              <DailyPatternChart
                data={overviewData.topSpecies}
                date={selectedDay}
                size={450}
              />
            )}
          </Paper>
        </Grid>

        {/* Species Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Top Species Distribution
            </Typography>
            {overviewData?.topSpecies && (
              <SpeciesDistributionChart data={overviewData.topSpecies} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Overview;
