import { useQuery } from '@tanstack/react-query';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import ThermostatIcon from '@mui/icons-material/DeviceThermostat';
import { BASE_API_URL } from '../../api/api';

interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  percent: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  title,
  value,
  percent,
}) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Icon color="action" />
        <Typography variant="h6">{title}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{ mb: 2, height: 8, borderRadius: 1 }}
      />
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export const SystemMonitor = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: async () => {
      const response = await fetch(`${BASE_API_URL}/system/metrics`);
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      return response.json();
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <LinearProgress />;
  if (error)
    return <Typography color="error">Error loading system metrics</Typography>;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        System Resources
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <SpeedIcon color="action" />
                <Typography variant="h6">CPU</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.cpu.percent}
                sx={{ mb: 2, height: 8, borderRadius: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {data.cpu.percent}% Usage
                </Typography>
                {data.cpu.temperature && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ThermostatIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {data.cpu.temperature}°C
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            icon={MemoryIcon}
            title="Memory"
            value={`${data.memory.used}GB / ${data.memory.total}GB (${data.memory.percent}%)`}
            percent={data.memory.percent}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            icon={StorageIcon}
            title="Disk"
            value={`${data.disk.used}GB / ${data.disk.total}GB (${data.disk.percent}%)`}
            percent={data.disk.percent}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
