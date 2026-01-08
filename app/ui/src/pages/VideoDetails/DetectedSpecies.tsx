import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { VideoSpecies } from '../../types';
import { labelToUniqueHexColor } from '../../util';

interface GroupedSpecies {
  species_id: number;
  species_name: string;
  image_url?: string;
  detections: VideoSpecies[];
  confidenceRange: string;
  totalDuration: number;
}

interface DetectedSpeciesProps {
  species: VideoSpecies[];
}

export const DetectedSpecies: React.FC<DetectedSpeciesProps> = ({
  species,
}) => {
  // Group species by species_id and calculate stats
  const groupedSpecies = species
    .filter((s) => s.source === 'video')
    .reduce((groups: GroupedSpecies[], sp) => {
      let group = groups.find((g) => g.species_id === sp.species_id);
      if (!group) {
        group = {
          species_id: sp.species_id,
          species_name: sp.species_name,
          image_url: sp.image_url,
          detections: [],
          confidenceRange: '',
          totalDuration: 0,
        };
        groups.push(group);
      }
      group.detections.push(sp);
      group.totalDuration += sp.end_time - sp.start_time;
      return groups;
    }, []);

  // Calculate confidence range for each group
  groupedSpecies.forEach((group) => {
    const confidences = group.detections.map((d) => d.confidence * 100);
    const min = Math.min(...confidences).toFixed(0);
    const max = Math.max(...confidences).toFixed(0);
    group.confidenceRange = min === max ? `${min}%` : `${min}% - ${max}%`;
  });

  if (groupedSpecies.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Species in This Video
      </Typography>
      <Grid container spacing={2}>
        {groupedSpecies.map((group) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.species_id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: `2px solid ${labelToUniqueHexColor(group.species_name)}`,
              }}
            >
              <CardMedia
                component="img"
                alt={group.species_name}
                image={group.image_url}
                sx={{
                  aspectRatio: '16/10',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
              />
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="subtitle1" noWrap>
                  {group.species_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {group.detections.length} detection
                  {group.detections.length > 1 ? 's' : ''} •{' '}
                  {Math.round(group.totalDuration)}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confidence: {group.confidenceRange}
                </Typography>
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
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
    </Box>
  );
};
