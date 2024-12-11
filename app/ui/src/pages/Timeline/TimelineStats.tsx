import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { SvgIconComponent } from '@mui/icons-material';
import AccessTime from '@mui/icons-material/AccessTime';
import Pets from '@mui/icons-material/Pets';
import Groups from '@mui/icons-material/Groups';
import { SpeciesVisit } from '../../types';

interface StatCardProps {
  icon: SvgIconComponent;
  title: string;
  value: string | number;
}

const StatCard = ({ icon: Icon, title, value }: StatCardProps) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={2}>
        <Icon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography color="text.secondary" variant="subtitle2">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const calculateTotalDurationMin = (data: SpeciesVisit[]) => {
  return Math.round(
    data.reduce((acc, visit) => {
      const start = new Date(visit.start_time).getTime();
      const end = new Date(visit.end_time).getTime();
      return acc + (end - start) / 1000 / 60;
    }, 0),
  );
};

export const TimelineStats = ({ visits }: { visits: SpeciesVisit[] }) => {
  const uniqueSpecies = new Set(visits.map((visit) => visit.species.id)).size;
  const totalDetections = visits.reduce(
    (acc, visit) => acc + visit.max_simultaneous,
    0,
  );
  const totalDurationMin = calculateTotalDurationMin(visits);

  return (
    <Grid container spacing={3} mb={5}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard icon={Pets} title="Unique Species" value={uniqueSpecies} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatCard icon={Groups} title="Total Visits" value={totalDetections} />
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
