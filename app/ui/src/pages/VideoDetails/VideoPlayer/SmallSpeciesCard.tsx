import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { VideoSpecies } from '../../../types';
import { formatConfidence, labelToUniqueHexColor } from '../../../util';
import { BASE_URL } from '../../../api/api';

export const SmallSpeciesCard: React.FC<{ species: VideoSpecies }> = ({
  species,
}) => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

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
            {species.source === 'audio' && (
              <Grid>
                <Tooltip title="View Spectrogram" placement="bottom">
                  <IconButton color="secondary" onClick={handleOpenDialog}>
                    <GraphicEqIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Spectrogram Dialog */}
      <Dialog maxWidth="lg" open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Spectrogram</DialogTitle>
        <DialogContent>
          {species.spectrogram_path ? (
            <img
              src={`${BASE_URL}/${species.spectrogram_path}`}
              alt="Spectrogram"
              style={{ width: '100%' }}
            />
          ) : (
            <Typography>No spectrogram available</Typography>
          )}
        </DialogContent>
        <DialogContent>
          <Button size="large" onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
