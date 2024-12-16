import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FoodIcon from '@mui/icons-material/Fastfood';
import { Video, VideoSpecies } from '../../types';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { WeatherCard } from '../../components/WeatherCard';
import { labelToUniqueHexColor } from '../../util';
import { Link } from 'react-router-dom';

interface GroupedSpecies {
  species_id: number;
  species_name: string;
  image_url?: string;
  detections: VideoSpecies[];
  confidenceRange: string;
  totalDuration: number;
}

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

  const formatDate = (date: string | Date) => new Date(date).toLocaleString();

  const groupedSpecies = species
    .filter((species) => species.source === 'video')
    .reduce((groups: GroupedSpecies[], sp) => {
      let group = groups.find(
        (g) => g.species_id === sp.species_id,
      ) as GroupedSpecies;
      if (!group) {
        group = {
          ...sp,
          detections: [],
          confidenceRange: '',
          totalDuration: 0, // Initialize total duration
        };
        groups.push(group);
      }
      // Add detection to the group
      group.detections.push(sp);
      // Calculate the duration for this detection (in seconds)
      const detectionDuration = sp.end_time - sp.start_time;
      // Add the detection duration to the total duration
      group.totalDuration += detectionDuration;
      return groups;
    }, []);

  // Calculate confidence range
  groupedSpecies.forEach((group) => {
    const confidences = group.detections.map((d) => d.confidence * 100);
    group.confidenceRange = `${Math.min(...confidences).toFixed(1)}% - ${Math.max(...confidences).toFixed(1)}%`;
  });

  return (
    <Box sx={{ padding: 2 }}>
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
          <Grid container spacing={2}>
            {groupedSpecies.map((group) => (
              <Grid size={{ xs: 12, md: 4 }} key={group.species_id}>
                <Card
                  sx={{
                    border: `2px solid ${labelToUniqueHexColor(group.species_name)}`,
                  }}
                >
                  <CardMedia
                    component="img"
                    alt={group.species_name}
                    height="175"
                    image={group.image_url}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {group.species_name} ({group.detections.length})
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      Confidence Range: {group.confidenceRange}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      Total Duration:{' '}
                      {Math.round(group.totalDuration * 10) / 10}s
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      component={Link}
                      to={`/species/${group.species_id}`}
                    >
                      Learn More
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
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
          <WeatherCard weather={weather} />
        </Grid>

        {/* Food Section */}
        {food.length > 0 && (
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
        )}
      </Grid>
    </Box>
  );
};
