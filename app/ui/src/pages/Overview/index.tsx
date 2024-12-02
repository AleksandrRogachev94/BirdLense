import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { StatCard } from '../../components/StatCard';
import Pets from '@mui/icons-material/Pets';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Videocam from '@mui/icons-material/Videocam';
import Audiotrack from '@mui/icons-material/Audiotrack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { OverviewStats, OverviewTopSpecies, Weather } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { fetchOverviewData, fetchWeather } from '../../api/api';
import { WeatherCard } from '../../components/WeatherCard';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const Heatmap = ({
  data,
  cellWidth = 20,
  cellHeight = 25,
}: {
  data: OverviewTopSpecies[];
  cellWidth?: number;
  cellHeight?: number;
}) => {
  const theme = useTheme();
  const hours = Array.from({ length: 24 }, (_, i) => i); // UTC hours
  const maxDetections = Math.max(...data.flatMap((d) => d.detections));

  const offsetInHours = new Date().getTimezoneOffset() / 60;

  const getOffsetValue = (detections: number[], hour: number) => {
    const localHour = hour + offsetInHours;
    return localHour >= 0 && localHour < 24 ? detections[localHour] : 0;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${hours.length}, 1fr)`,
          rowGap: `${(5 * 10) / data.length}px`,
        }}
      >
        {data.map((item) => (
          <React.Fragment key={item.name}>
            {item.detections.map((_, hour) => (
              <Tooltip
                key={`${item.name}-${hour}`}
                title={`${getOffsetValue(item.detections, hour)} detections`}
                arrow
                followCursor
              >
                <div
                  style={{
                    width: `${cellWidth}px`,
                    height: `${(cellHeight * 10) / data.length}px`,
                    opacity:
                      getOffsetValue(item.detections, hour) / maxDetections,
                    backgroundColor: theme.palette.secondary.main,
                  }}
                />
              </Tooltip>
            ))}
          </React.Fragment>
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${hours.length}, 1fr)`,
          mt: 1,
        }}
      >
        {hours.map((hour) => (
          <Box
            key={hour}
            sx={{
              textAlign: 'center',
              fontSize: '0.75em',
              width: `${cellWidth}px`,
              height: `${cellHeight}px`,
            }}
          >
            {hour}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const TopSpecies = ({
  data,
  date,
}: {
  data: OverviewTopSpecies[];
  date: Dayjs;
}) => {
  const navigate = useNavigate();
  const summedData = data.map((entry) => ({
    id: entry.id,
    name: entry.name,
    detections: entry.detections.reduce((a, b) => a + b, 0),
  }));
  return (
    <Box mb={2}>
      <Typography variant="h6" gutterBottom>
        Top 10 Species
      </Typography>
      <Grid container>
        <Grid size={{ lg: 6 }}>
          <BarChart
            dataset={summedData}
            layout="horizontal"
            xAxis={[{ scaleType: 'linear' }]} // Continuous x-axis
            yAxis={[
              {
                scaleType: 'band',
                dataKey: 'name',
              },
            ]} // Categorical y-axis
            series={[
              {
                dataKey: 'detections',
              },
            ]}
            width={600}
            height={400}
            margin={{ left: 130 }}
            onItemClick={(_, item) =>
              navigate(
                `/timeline?speciesId=${summedData[item.dataIndex].id}&date=${date.toISOString()}&time=`,
              )
            }
          />
        </Grid>
        <Grid mt={6.5} size={{ lg: 6 }}>
          <Heatmap data={data} />
        </Grid>
        <Grid
          size={{ lg: 6 }}
          container
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="h6">Detection Count</Typography>
        </Grid>
        <Grid
          size={{ lg: 6 }}
          container
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="h6">Hours of Day</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

const StatsGrid = ({
  stats,
  weather,
}: {
  stats: OverviewStats;
  weather: Weather;
}) => (
  <Grid container spacing={2} mb={5}>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={Pets}
        title="Unique Species"
        value={stats.uniqueSpecies}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={TrendingUp}
        title="Busiest Hour"
        value={stats.busiestHour}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={Pets}
        title="Last Hour Detections"
        value={stats.lastHourDetections}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={Pets}
        title="Total Detections"
        value={stats.totalDetections}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={Videocam}
        title="Video Detections"
        value={stats.videoDetections}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={Audiotrack}
        title="Audio Detections"
        value={stats.audioDetections}
      />
    </Grid>
    {weather && (
      <Grid size={{ xs: 6, sm: 6 }}>
        <WeatherCard weather={weather} />
      </Grid>
    )}
  </Grid>
);

export const Overview = () => {
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs()); // Default to today

  const {
    data: overviewData,
    isLoading: isLoadingSightings,
    error: errorSightings,
  } = useQuery({
    queryKey: ['overview', selectedDay?.format('YYYY-MM-DD')],
    queryFn: () => fetchOverviewData(selectedDay?.format('YYYY-MM-DD') || ''),
    enabled: !!selectedDay, // Ensure query is only executed when a valid day is selected
  });

  // TODO move it to weather card
  // Fetch weather data
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
    <>
      <Box display="flex" justifyContent="center" alignItems="center">
        <Typography variant="h4" mb={3}>
          Overview
        </Typography>
      </Box>

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ '& > :not(style)': { m: 1, mb: 4, width: '25ch' } }}
      >
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

      <StatsGrid
        stats={overviewData?.stats as OverviewStats}
        weather={weather as Weather}
      />
      {overviewData?.topSpecies?.length > 0 && (
        <TopSpecies
          data={overviewData?.topSpecies as OverviewTopSpecies[]}
          date={selectedDay}
        />
      )}
    </>
  );
};
