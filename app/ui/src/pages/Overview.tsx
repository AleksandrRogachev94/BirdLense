import React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { StatCard } from '../components/StatCard';
import { Audiotrack, Pets, Videocam, TrendingUp } from '@mui/icons-material';
import { Box, CircularProgress, Tooltip, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { OverviewStats, OverviewTopSpecies, Weather } from '../types';
import { useQuery } from '@tanstack/react-query';
import { fetchOverviewData, fetchWeather } from '../api/api';
import { WeatherCard } from '../components/WeatherCard';
import { useNavigate } from 'react-router-dom';

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
  const maxDetections = Math.max(...data.flatMap((d) => d.detections));

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
            {item.detections.map((d, hour) => (
              <Tooltip
                key={`${item.name}-${hour}`}
                title={`${d} detections`}
                arrow
                followCursor
              >
                <div
                  style={{
                    width: `${cellWidth}px`,
                    height: `${(cellHeight * 10) / data.length}px`,
                    opacity: d / maxDetections,
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

const TopSpecies = ({ data }: { data: OverviewTopSpecies[] }) => {
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
              navigate(`/timeline?speciesId=${summedData[item.dataIndex].id}`)
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
  const {
    data: overviewData,
    isLoading: isLoadingSightings,
    error: errorSightings,
  } = useQuery({
    queryKey: ['overview'],
    queryFn: () => fetchOverviewData(),
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
