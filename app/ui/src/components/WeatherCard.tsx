import { Box, Chip, Paper, Typography } from '@mui/material';
import { Weather } from '../types';
import WeatherIcon from '@mui/icons-material/WbSunny';
import TempIcon from '@mui/icons-material/Thermostat';
import HumidityIcon from '@mui/icons-material/Opacity';
import CloudIcon from '@mui/icons-material/Cloud';
import WindIcon from '@mui/icons-material/Air';

export const WeatherCard = ({ weather }: { weather: Weather }) => {
  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Weather
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip icon={<WeatherIcon />} label={`Condition: ${weather.main}`} />
        <Chip icon={<CloudIcon />} label={`Clouds: ${weather.clouds}%`} />
        <Chip
          icon={<TempIcon />}
          label={`Temp: ${Math.round(weather.temp)}°C`}
        />
        <Chip
          icon={<HumidityIcon />}
          label={`Humidity: ${weather.humidity}%`}
        />
        <Chip
          icon={<WindIcon />}
          label={`Wind Speed: ${weather.wind_speed} m/s`}
        />
      </Box>
    </Paper>
  );
};
