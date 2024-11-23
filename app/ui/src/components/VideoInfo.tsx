import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WeatherIcon from '@mui/icons-material/WbSunny';
import TempIcon from '@mui/icons-material/Thermostat';
import HumidityIcon from '@mui/icons-material/Opacity';
import CloudIcon from '@mui/icons-material/Cloud';
import WindIcon from '@mui/icons-material/Air';
import FoodIcon from '@mui/icons-material/Fastfood';
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

  const groupedSpecies = species.reduce((groups: any[], sp) => {
    let group = groups.find((g) => g.species_id === sp.species_id);
    if (!group) {
      group = {
        ...sp,
        start_time: new Date(sp.start_time), // Parse to Date object
        end_time: new Date(sp.end_time), // Parse to Date object
        detections: [],
        confidenceRange: '',
      };
      groups.push(group);
    }

    group.detections.push(sp);

    // Update start and end times to the earliest and latest, respectively
    group.start_time = new Date(
      Math.min(group.start_time.getTime(), new Date(sp.start_time).getTime()),
    );
    group.end_time = new Date(
      Math.max(group.end_time.getTime(), new Date(sp.end_time).getTime()),
    );

    return groups;
  }, []);

  // Calculate confidence range
  groupedSpecies.forEach((group) => {
    const confidences = group.detections.map((d) => d.confidence * 100);
    group.confidenceRange = `${Math.min(...confidences).toFixed(1)}% - ${Math.max(...confidences).toFixed(1)}%`;
  });

  console.log(groupedSpecies);

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
        {/* Species Section */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6" gutterBottom>
            Detected Species
          </Typography>
          {groupedSpecies.map((group) => (
            <Paper
              key={group.species_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                marginBottom: 2,
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              {/* Bird Photo */}
              <Box sx={{ width: 100, height: 100, marginRight: 2 }}>
                <img
                  src={group.image_url}
                  alt={group.species_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              </Box>

              {/* Details Section */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {group.species_name} ({group.detections.length} detections)
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Confidence Range: {group.confidenceRange}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Seen from {formatDate(group.start_time)} to{' '}
                  {formatDate(group.end_time)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Grid>

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
      </Grid>
    </Box>
  );
};
