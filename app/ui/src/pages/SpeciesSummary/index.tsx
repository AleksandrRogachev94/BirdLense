import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import { LineChart, ScatterChart } from '@mui/x-charts';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloudIcon from '@mui/icons-material/Cloud';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { CircularProgress } from '@mui/material';
import { SpeciesSummary } from '../../types';
import { fetchSpeciesSummary } from '../../api/api';
import { labelToUniqueHexColor } from '../../util';

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

const SpeciesSummaryPage = () => {
  const { id } = useParams<{ id: string }>();
  const speciesId = id ? +id : undefined;

  const { data, isLoading, error } = useQuery<SpeciesSummary>({
    queryKey: ['speciesSummary', speciesId],
    queryFn: () => fetchSpeciesSummary(speciesId as number),
  });

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error || !data) return <div>Error loading data.</div>;

  const hours = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, '0')}:00`,
  );

  // Adjust timezone for activity data
  const tzOffset = new Date().getTimezoneOffset() / 60;
  const adjustTimeZone = (activity: number[]) =>
    activity.map((_, idx) => {
      let localIdx = idx + tzOffset;
      if (localIdx < 0) localIdx += 24;
      if (localIdx >= 24) localIdx -= 24;
      return activity[Math.floor(localIdx)];
    });

  const localActivity = adjustTimeZone(data.stats.hourlyActivity);
  const subspeciesActivities = data.subspecies.map((sub) => ({
    name: sub.species.name,
    data: adjustTimeZone(sub.stats.hourlyActivity),
  }));

  return (
    <Box pb={4}>
      {/* Show parent link if species is not active */}
      {!data.species.active && data.species.parent && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Link
              component={RouterLink}
              to={`/species/${data.species.parent.id}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              View {data.species.parent.name}
            </Link>
          }
        >
          This is a subspecies of {data.species.parent.name}
        </Alert>
      )}
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
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="justify"
              sx={{ mb: 2 }}
            >
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
            title="Total Detection Stats"
          >
            <Stack spacing={1.5}>
              <Typography variant="body1">
                Last 24 hours:{' '}
                <strong>{data.stats.detections.detections_24h}</strong>
              </Typography>
              <Typography variant="body1">
                Last 7 days:{' '}
                <strong>{data.stats.detections.detections_7d}</strong>
              </Typography>
              <Typography variant="body1">
                Last 30 days:{' '}
                <strong>{data.stats.detections.detections_30d}</strong>
              </Typography>
              {data.subspecies.length > 0 && (
                <>
                  <Divider />
                  {data.subspecies.map((sub) => (
                    <Box key={sub.species.id}>
                      <Link
                        variant="subtitle2"
                        color="primary"
                        component={RouterLink}
                        to={`/species/${sub.species.id}`}
                      >
                        {sub.species.name}
                      </Link>
                      <Typography variant="body2">
                        24h: {sub.stats.detections.detections_24h} | 7d:{' '}
                        {sub.stats.detections.detections_7d} | 30d:{' '}
                        {sub.stats.detections.detections_30d}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
              <Divider />
              {data.stats.timeRange.first_sighting && (
                <Typography variant="body2" color="text.secondary">
                  First seen:{' '}
                  {new Date(
                    data.stats.timeRange.first_sighting,
                  ).toLocaleDateString()}
                </Typography>
              )}
              {data.stats.timeRange.last_sighting && (
                <Typography variant="body2" color="text.secondary">
                  Last seen:{' '}
                  {new Date(
                    data.stats.timeRange.last_sighting,
                  ).toLocaleDateString()}
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
            <Box sx={{ width: '100%', height: 300 }}>
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
                    // area: true,
                    color: labelToUniqueHexColor(data.species.name as string),
                    label: 'Total',
                  },
                  ...subspeciesActivities.map((sub) => ({
                    data: sub.data,
                    color: labelToUniqueHexColor(sub.name as string),
                    label: sub.name,
                  })),
                ]}
                height={300}
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
            <Box sx={{ width: '100%', height: 300 }}>
              <ScatterChart
                height={300}
                series={[
                  {
                    data: data.stats.weather.map((stat, index) => ({
                      id: index,
                      x: stat.temp,
                      y: stat.clouds,
                      size: Math.min(20, Math.max(5, stat.count / 5)),
                    })),
                    label: 'Total Sightings',
                  },
                ]}
                xAxis={[{ label: 'Temperature (°C)' }]}
                yAxis={[{ label: 'Cloudiness (%)' }]}
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
              {data.stats.food.map((food) => (
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

export default SpeciesSummaryPage;
