import Grid from '@mui/material/Grid2';
import { BirdSighting } from '../../types';
import AccessTime from '@mui/icons-material/AccessTime';
import Pets from '@mui/icons-material/Pets';
import { StatCard } from '../../components/StatCard';

const calculateSpeciesSpotted = (data: BirdSighting[]) => {
  const speciesSet = new Set<number>();
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

export const TimelineStats = ({ sightings }: { sightings: BirdSighting[] }) => {
  const speciesSpotted = calculateSpeciesSpotted(sightings);
  const totalDurationMin = calculateTotalDurationMin(sightings);

  return (
    <Grid container spacing={3} mb={5}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard icon={Pets} title="Unique Species" value={speciesSpotted} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          icon={Pets}
          title="Total Detections"
          value={sightings.length}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard
          icon={AccessTime}
          title="Total Duration"
          value={`${totalDurationMin}m`}
        />
      </Grid>
    </Grid>
  );
};
