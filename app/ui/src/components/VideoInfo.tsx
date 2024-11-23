import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WeatherIcon from '@mui/icons-material/WbSunny';
import TempIcon from '@mui/icons-material/Thermostat';
import HumidityIcon from '@mui/icons-material/Opacity';
import CloudIcon from '@mui/icons-material/Cloud';
import WindIcon from '@mui/icons-material/Air';
import FoodIcon from '@mui/icons-material/Fastfood';
import SpeciesIcon from '@mui/icons-material/Pets';
import { Video } from '../types';

export const VideoInfo = ({ video }: { video: Video }) => {
  const {
    processor_version,
    start_time,
    end_time,
    favorite,
    weather,
    species,
    food,
  } = video;

  const formatDate = (date: string) => new Date(date).toLocaleString();

  return (
    <Box sx={{ padding: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Video Information
      </Typography>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2 }}
      >
        {favorite && (
          <Chip
            icon={<FavoriteIcon />}
            label="Favorite"
            color="primary"
            size="small"
          />
        )}
      </Box>
      <Divider sx={{ marginBottom: 4 }} />

      <Grid container spacing={2}>
        {/* General Info Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              General Info
            </Typography>
            <Typography variant="body1">
              Processor Version: {processor_version}
            </Typography>
            <Typography variant="body1">
              Start Time: {formatDate(start_time)}
            </Typography>
            <Typography variant="body1">
              End Time: {formatDate(end_time)}
            </Typography>
          </Paper>
        </Grid>

        {/* Weather Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weather
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<WeatherIcon />}
                label={`Condition: ${weather.main}`}
              />
              <Chip icon={<CloudIcon />} label={`Clouds: ${weather.clouds}%`} />
              <Chip icon={<TempIcon />} label={`Temp: ${weather.temp}°C`} />
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
        </Grid>

        {/* Food Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Bird Food
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {food.map((f) => (
                <Chip
                  key={f.id}
                  icon={<FoodIcon />}
                  label={f.name}
                  variant="outlined"
                  color="success"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        {/* Species Section */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Detected Species
            </Typography>
            <List>
              {species.map((sp) => (
                <ListItem key={sp.species_id}>
                  <SpeciesIcon sx={{ marginRight: 2, color: 'green' }} />
                  <ListItemText
                    primary={`${sp.species_name} (Confidence: ${(sp.confidence * 100).toFixed(1)}%)`}
                    secondary={`From: ${formatDate(sp.start_time)} to ${formatDate(sp.end_time)} (Source: ${sp.source})`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
