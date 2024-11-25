import Grid from '@mui/material/Grid2';
import { BirdSighting, Weather } from '../types';
import { AccessTime, Pets } from '@mui/icons-material';
import { WeatherCard } from './WeatherCard';
import { StatCard } from './StatCard';

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
        <StatCard
          icon={Pets}
          title="Total Sightings"
          value={sightings.length}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard icon={Pets} title="Species Spotted" value={speciesSpotted} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          icon={AccessTime}
          title="Total Duration"
          value={`${totalDurationMin}m`}
        />
      </Grid>
      {weather && (
        <Grid size={{ xs: 6, sm: 6 }}>
          <WeatherCard weather={weather} />
        </Grid>
      )}
    </Grid>
  );
};
