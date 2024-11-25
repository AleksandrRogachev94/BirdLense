import React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { StatCard } from '../components/StatCard';
import { Audiotrack, Pets, Videocam, TrendingUp } from '@mui/icons-material';
import { Box, CircularProgress, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { OverviewStats, OverviewTopSpecies, Weather } from '../types';
import { useQuery } from '@tanstack/react-query';
import { fetchOverviewData, fetchWeather } from '../api/api';
import { WeatherCard } from '../components/WeatherCard';

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
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // Max detections to set color intensity
  const maxDetections = Math.max(...data.flatMap((d) => d.detections));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // padding: 4,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${hours.length}, 1fr)`,
          // gap: '1px',
          rowGap: '5px',
        }}
      >
        {data.map((item) => (
          <React.Fragment key={item.name}>
            {/* Heatmap Cells */}
            {item.detections.map((d, hour) => (
              <div
                key={`${item.name}-${hour}`}
                style={{
                  width: `${cellWidth}px`,
                  height: `${cellHeight}px`,
                  opacity: d / maxDetections,
                  backgroundColor: theme.palette.secondary.main,
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${hours.length}, 1fr)`,
        }}
      >
        {/* X-Axis Labels (Hours) */}
        {hours.map((hour) => (
          <div
            key={hour}
            style={{
              textAlign: 'center',
              fontSize: '0.75em',
              width: `${cellWidth}px`,
              height: `${cellHeight}px`,
            }}
          >
            {hour}
          </div>
        ))}
      </div>
    </Box>
  );
};

const TopSpecies = ({ data }: { data: OverviewTopSpecies[] }) => {
  const summedData = data.map((entry) => ({
    name: entry.name,
    detections: entry.detections.reduce((a, b) => a + b, 0),
  }));
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Top 10 Species
      </Typography>
      <Grid container>
        <Grid>
          <BarChart
            dataset={summedData}
            layout="horizontal"
            xAxis={[{ scaleType: 'linear', dataKey: 'detections' }]} // Continuous x-axis
            yAxis={[
              {
                scaleType: 'band',
                dataKey: 'name',
                valueFormatter: (value) => value.replace(' ', '\n'),
              },
            ]} // Categorical y-axis
            series={[
              {
                dataKey: 'detections',
              },
            ]}
            width={600}
            height={400}
            margin={{ left: 100 }}
          />
        </Grid>
        <Grid mt={6.5}>
          <Heatmap data={data} />
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
        icon={Pets}
        title="Total Detections"
        value={stats.totalDetections}
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
        icon={Videocam}
        title="Video-Based Detections"
        value={stats.videoDetections}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={Audiotrack}
        title="Audio-Based Detections"
        value={stats.audioDetections}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <StatCard
        icon={TrendingUp}
        title="Busiest Hour"
        value={stats.busiestHour}
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
  const {
    data: overviewData,
    isLoading: isLoadingSightings,
    error: errorSightings,
  } = useQuery({
    queryKey: ['overview'],
    queryFn: () => fetchOverviewData(),
  });

  // Fetch weather data
  const {
    data: weather,
    isLoading: isLoadingWeather,
    error: errorWeather,
  } = useQuery({
    queryKey: ['weather'],
    queryFn: () => fetchWeather(),
  });

  if (isLoadingSightings || isLoadingWeather)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (errorSightings || errorWeather) return <div>Error loading data.</div>;

  return (
    <>
      <Typography variant="h4" mb={3}>
        Today Overview
      </Typography>

      <StatsGrid
        stats={overviewData?.stats as OverviewStats}
        weather={weather as Weather}
      />
      <TopSpecies data={overviewData?.topSpecies as OverviewTopSpecies[]} />
    </>
  );
};
