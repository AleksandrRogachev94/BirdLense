import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import WeatherIcon from '@mui/icons-material/WbSunny';
import TempIcon from '@mui/icons-material/Thermostat';
import HumidityIcon from '@mui/icons-material/Opacity';
import CloudIcon from '@mui/icons-material/Cloud';
import WindIcon from '@mui/icons-material/Air';
import SettingsIcon from '@mui/icons-material/Settings';
import { Weather } from '../types';

export const WeatherCard = ({ weather }: { weather: Weather }) => {
  const isConfigured = Object.keys(weather).length > 0;

  if (!isConfigured) {
    return (
      <Paper sx={{ padding: 2 }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ width: '100%' }}>
            Weather
          </Typography>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography color="text.secondary" paragraph>
              Weather information is not configured yet.
            </Typography>
            <Button
              component={Link}
              to="/settings"
              startIcon={<SettingsIcon />}
              variant="contained"
              color="primary"
            >
              Configure Weather Settings
            </Button>
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ padding: 2, height: '100%' }}>
      <Stack spacing={2}>
        <Typography variant="h6">Weather</Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiChip-root': {
              minWidth: 120,
            },
          }}
        >
          <Chip
            icon={<WeatherIcon />}
            label={weather.main}
            title={weather.description}
          />
          <Chip icon={<CloudIcon />} label={`${weather.clouds}%`} />
          <Chip icon={<TempIcon />} label={`${Math.round(weather.temp)}°C`} />
          <Chip icon={<HumidityIcon />} label={`${weather.humidity}%`} />
          <Chip icon={<WindIcon />} label={`${weather.wind_speed} m/s`} />
        </Box>
      </Stack>
    </Paper>
  );
};
