import Grid from '@mui/material/Grid2';
import { BirdSighting, Weather } from '../types';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { AccessTime, Pets } from '@mui/icons-material';
import { WeatherCard } from './WeatherCard';

const calculateSpeciesSpotted = (data: BirdSighting[]) => {
  const speciesSet = new Set<string>();
  data.forEach((entry) => {
    speciesSet.add(entry.species.id);
  });
  return speciesSet.size;
};

const calculateTotalDurationMin = (data: BirdSighting[]) => {
  let totalDuration = 0;
  data.forEach((entry) => {
    const start = new Date(entry.start_time).getTime();
    const end = new Date(entry.end_time).getTime();
    totalDuration += (end - start) / 1000;
  });
  return Math.round(totalDuration / 60);
};

export const Stats = ({
  sightings,
  weather,
}: {
  sightings: BirdSighting[];
  weather: Weather;
}) => {
  const speciesSpotted = calculateSpeciesSpotted(sightings);
  const totalDurationMin = calculateTotalDurationMin(sightings);

  return (
    <Grid container spacing={3} mb={5}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center">
                <Pets fontSize="large" sx={{ mr: 1 }} color="primary" />
                <span>Total Sightings</span>
              </Box>
            </Typography>
            <Typography variant="h5">
              <strong>{sightings.length}</strong>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center">
                <Pets fontSize="large" sx={{ mr: 1 }} color="primary" />
                <span>Species Spotted</span>
              </Box>
            </Typography>
            <Typography variant="h5">
              <strong>{speciesSpotted}</strong>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center">
                <AccessTime fontSize="large" sx={{ mr: 1 }} color="primary" />
                <span>Total Duration</span>
              </Box>
            </Typography>
            <Typography variant="h5">
              <strong>{totalDurationMin}m</strong>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      {weather && (
        <Grid size={{ xs: 6, sm: 6 }}>
          <WeatherCard weather={weather} />
        </Grid>
      )}
    </Grid>
  );
};
