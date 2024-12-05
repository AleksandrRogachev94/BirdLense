import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import { VideoSpecies } from '../../../types';
import { formatConfidence, labelToUniqueHexColor } from '../../../util';

export const SmallSpeciesCard: React.FC<{ species: VideoSpecies }> = ({
  species,
}) => {
  return (
    <>
      <Card
        sx={{
          height: 200,
          border: `2px solid ${labelToUniqueHexColor(species.species_name)}`,
        }}
      >
        <CardMedia
          sx={{ height: 100 }}
          image={species.image_url}
          title={species.species_name}
        />
        <CardContent>
          <Typography
            gutterBottom
            noWrap
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {species.species_name}
          </Typography>
          <Grid container spacing={1} alignItems="center">
            <Grid>
              <Chip
                label={`${formatConfidence(species.confidence)}`}
                size="small"
                color="success"
              />
            </Grid>
            <Grid>
              <Chip label={species.source} size="small" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  );
};
