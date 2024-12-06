import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import { LineChart, ScatterChart } from '@mui/x-charts';
import InfoIcon from '@mui/material/Icon/Icon';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloudIcon from '@mui/icons-material/Cloud';
import RestaurantIcon from '@mui/icons-material/Restaurant';

interface SpeciesSummary {
  species: {
    id: number;
    name: string;
    image_url: string | null;
    description: string | null;
  };
  stats: {
    detections_24h: number;
    detections_7d: number;
    detections_30d: number;
    first_sighting: string | null;
    last_sighting: string | null;
  };
  activity_by_hour: number[];
  weather_stats: Array<{
    temp: number;
    clouds: number;
    count: number;
  }>;
  food_preferences: Array<{
    name: string;
    count: number;
  }>;
}

const StatCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <Card elevation={2} sx={{ height: '100%', bgcolor: 'background.paper' }}>
    <CardContent>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="h6" color="primary">
            {title}
          </Typography>
        </Stack>
        <Divider />
        {children}
      </Stack>
    </CardContent>
  </Card>
);

const SpeciesSummary = () => {
  const { id } = useParams<{ id: string }>();
  const speciesId = id ? +id : undefined;

  const { data, isLoading } = useQuery<SpeciesSummary>({
    queryKey: ['speciesSummary', speciesId],
    queryFn: async () => {
      const response = await fetch(`/api/ui/species/${speciesId}/summary`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
  });

  if (isLoading || !data) {
    return <Typography>Loading...</Typography>;
  }

  const hours = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, '0')}:00`,
  );

  // Adjust the activity data array to match local timezone
  const tzOffset = new Date().getTimezoneOffset() / 60;
  const localActivity = data.activity_by_hour.map((_, idx) => {
    // Convert UTC index to local index by adding the offset
    let localIdx = idx + tzOffset;
    // Handle wraparound for negative indices or indices >= 24
    if (localIdx < 0) localIdx += 24;
    if (localIdx >= 24) localIdx -= 24;
    return data.activity_by_hour[Math.floor(localIdx)];
  });

  console.log({ activity: data.activity_by_hour, localActivity });

  return (
    <Box p={3}>
      {/* Header Section */}
      <Paper elevation={0} sx={{ mb: 4, bgcolor: 'background.default' }}>
        <Grid container spacing={4} alignItems="center">
          {data.species.image_url && (
            <Grid size={{ xs: 12, md: 4 }}>
              <img
                src={data.species.image_url}
                alt={data.species.name}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: data.species.image_url ? 8 : 12 }}>
            <Typography variant="h4" gutterBottom color="primary">
              {data.species.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {data.species.description}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3}>
        {/* Detection Stats */}
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard
            icon={<InfoIcon fontSize="small" />}
            title="Detection Stats"
          >
            <Stack spacing={1.5}>
              <Typography variant="body1">
                Last 24 hours: <strong>{data.stats.detections_24h}</strong>
              </Typography>
              <Typography variant="body1">
                Last 7 days: <strong>{data.stats.detections_7d}</strong>
              </Typography>
              <Typography variant="body1">
                Last 30 days: <strong>{data.stats.detections_30d}</strong>
              </Typography>
              <Divider />
              {data.stats.first_sighting && (
                <Typography variant="body2" color="text.secondary">
                  First seen:{' '}
                  {new Date(data.stats.first_sighting).toLocaleDateString()}
                </Typography>
              )}
              {data.stats.last_sighting && (
                <Typography variant="body2" color="text.secondary">
                  Last seen:{' '}
                  {new Date(data.stats.last_sighting).toLocaleDateString()}
                </Typography>
              )}
            </Stack>
          </StatCard>
        </Grid>

        {/* Daily Activity Pattern */}
        <Grid size={{ xs: 12, md: 8 }}>
          <StatCard
            icon={<AccessTimeIcon fontSize="small" />}
            title="Daily Activity Pattern"
          >
            <Box sx={{ width: '100%', height: 250 }}>
              <LineChart
                xAxis={[
                  {
                    data: hours,
                    scaleType: 'band',
                    tickLabelStyle: {
                      angle: 45,
                      textAnchor: 'start',
                      fontSize: 12,
                    },
                  },
                ]}
                series={[
                  {
                    data: localActivity,
                    area: true,
                    color: '#059669',
                    label: 'Detections',
                  },
                ]}
                height={250}
              />
            </Box>
          </StatCard>
        </Grid>

        {/* Weather Preferences */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StatCard
            icon={<CloudIcon fontSize="small" />}
            title="Weather Preferences"
          >
            <Box sx={{ width: '100%', height: 250 }}>
              <ScatterChart
                width={400}
                height={250}
                series={[
                  {
                    data: data.weather_stats.map((stat, index) => ({
                      id: index,
                      x: stat.temp,
                      y: stat.clouds,
                      size: Math.min(20, Math.max(5, stat.count / 5)),
                    })),
                    label: 'Sightings',
                  },
                ]}
                xAxis={[
                  {
                    label: 'Temperature (°C)',
                  },
                ]}
                yAxis={[
                  {
                    label: 'Cloudiness (%)',
                  },
                ]}
              />
            </Box>
          </StatCard>
        </Grid>

        {/* Food Preferences */}
        <Grid size={{ xs: 12, md: 6 }}>
          <StatCard
            icon={<RestaurantIcon fontSize="small" />}
            title="Common Food During Sightings"
          >
            <Stack spacing={2}>
              {data.food_preferences.map((food) => (
                <Box
                  key={food.name}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body1">{food.name}</Typography>
                  <Typography variant="body1" color="primary.main">
                    {food.count} sightings
                  </Typography>
                </Box>
              ))}
            </Stack>
          </StatCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SpeciesSummary;
