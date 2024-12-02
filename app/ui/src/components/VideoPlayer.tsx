import { useRef, useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import useTheme from '@mui/material/styles/useTheme';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import ReactPlayer from 'react-player';
import { Video, VideoSpecies } from '../types';
import { formatConfidence, labelToUniqueHexColor } from '../util';
import { BASE_URL } from '../api/api';

const SmallSpeciesCard = ({ species }: { species: VideoSpecies }) => {
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

      {/* Dialog for displaying Spectrogram */}
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
        <DialogActions>
          <Button size="large" onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const VideoPlayer = ({ video }: { video: Video }) => {
  const theme = useTheme();
  const videoRef = useRef<ReactPlayer | null>(null);
  const audioRef = useRef<ReactPlayer | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  const duration =
    new Date(video.end_time).getTime() / 1000 -
    new Date(video.start_time).getTime() / 1000;

  const activeSpecies = useMemo(
    () =>
      video.species.filter(
        (species) =>
          progress >= species.start_time && progress <= species.end_time,
      ),
    [progress, video.species],
  );

  const handleProgress = (state: { playedSeconds: number }) => {
    setProgress(state.playedSeconds);
  };

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.seekTo(time, 'seconds');
    }
    if (audioRef.current) {
      audioRef.current.seekTo(time, 'seconds');
    }
    setProgress(time);
  }, []);

  const handleProgressBarSeek = useCallback(
    (event: React.MouseEvent) => {
      if (progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const seekPosition = (event.clientX - rect.left) / rect.width;
        const seekTime = seekPosition * duration;
        handleSeek(seekTime);
      }
    },
    [duration, handleSeek],
  );

  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Box>
      {/* Video Player */}
      <Box height={500} position="relative">
        <ReactPlayer
          ref={videoRef}
          url={`${BASE_URL}/${video.video_path}`}
          playing={playing}
          controls={false}
          onProgress={handleProgress}
          height="100%"
          width="100%"
        />
        <ReactPlayer
          ref={audioRef}
          url={`${BASE_URL}/${video.audio_path}`}
          playing={playing}
          controls={false}
          height="0"
          width="0"
        />

        {/* Play/Pause Overlay Button */}
        <IconButton
          onClick={togglePlayPause}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
          }}
        >
          {playing ? (
            <PauseIcon fontSize="large" />
          ) : (
            <PlayArrowIcon fontSize="large" />
          )}
        </IconButton>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ position: 'relative', mt: 2 }}>
        <Box display="flex" alignItems="center">
          <Box
            ref={progressBarRef}
            onClick={handleProgressBarSeek}
            sx={{
              position: 'relative',
              height:
                (() => {
                  // Sort and group overlapping detections
                  const sortedSpecies = [...video.species].sort(
                    (a, b) => a.start_time - b.start_time,
                  );

                  // More robust layering mechanism
                  const layers: Array<
                    Array<{
                      species: (typeof sortedSpecies)[0];
                      startPercentage: number;
                      endPercentage: number;
                      width: number;
                    }>
                  > = [];

                  sortedSpecies.forEach((species) => {
                    const startPercentage = Math.min(
                      (species.start_time / duration) * 100,
                      100,
                    );
                    const endPercentage = Math.min(
                      (species.end_time / duration) * 100,
                      100,
                    );
                    const width = Math.min(
                      endPercentage - startPercentage,
                      100 - startPercentage,
                    );

                    // Find a layer where this detection doesn't overlap
                    let layerIndex = layers.findIndex(
                      (layer) =>
                        !layer.some(
                          (existingDetection) =>
                            !(
                              endPercentage <=
                                existingDetection.startPercentage ||
                              startPercentage >= existingDetection.endPercentage
                            ),
                        ),
                    );

                    // If no existing layer works, create a new one
                    if (layerIndex === -1) {
                      layerIndex = layers.length;
                      layers.push([]);
                    }

                    // Add detection to the appropriate layer
                    layers[layerIndex].push({
                      species,
                      startPercentage,
                      endPercentage,
                      width,
                    });
                  });

                  // Calculate dynamic height
                  return layers.length * 12;
                })() + 'px',
              backgroundColor: 'white',
              borderRadius: '4px',
              flexGrow: 1,
              overflow: 'hidden',
              border: '1px solid #e0e0e0',
              cursor: 'pointer',
            }}
          >
            {/* Played Section */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(progress / duration) * 100}%`,
                backgroundColor: theme.palette.grey[600],
                zIndex: 1,
              }}
            />

            {/* Detection Markers - Improved Layered Approach */}
            {(() => {
              // Sort and group overlapping detections
              const sortedSpecies = [...video.species].sort(
                (a, b) => a.start_time - b.start_time,
              );

              // More robust layering mechanism
              const layers: Array<
                Array<{
                  species: (typeof sortedSpecies)[0];
                  startPercentage: number;
                  endPercentage: number;
                  width: number;
                }>
              > = [];

              sortedSpecies.forEach((species) => {
                const startPercentage = Math.min(
                  (species.start_time / duration) * 100,
                  100,
                );
                const endPercentage = Math.min(
                  (species.end_time / duration) * 100,
                  100,
                );
                const width = Math.min(
                  endPercentage - startPercentage,
                  100 - startPercentage,
                );

                // Find a layer where this detection doesn't overlap
                let layerIndex = layers.findIndex(
                  (layer) =>
                    !layer.some(
                      (existingDetection) =>
                        !(
                          endPercentage <= existingDetection.startPercentage ||
                          startPercentage >= existingDetection.endPercentage
                        ),
                    ),
                );

                // If no existing layer works, create a new one
                if (layerIndex === -1) {
                  layerIndex = layers.length;
                  layers.push([]);
                }

                // Add detection to the appropriate layer
                layers[layerIndex].push({
                  species,
                  startPercentage,
                  endPercentage,
                  width,
                });
              });

              // Render detections across layers
              return layers.flatMap((layer, layerIdx) =>
                layer.map((detection, index) => (
                  <Box
                    key={`${layerIdx}-${index}`}
                    sx={{
                      position: 'absolute',
                      left: `${detection.startPercentage}%`,
                      top: `${layerIdx * 12}px`, // Consistent vertical spacing
                      height: '10px',
                      width: `${detection.width}%`,
                      backgroundColor: labelToUniqueHexColor(
                        detection.species.species_name,
                      ),
                      opacity: 0.5,
                      zIndex: 2,
                    }}
                    title={`${detection.species.species_name} (${formatTime(detection.species.start_time)} - ${formatTime(detection.species.end_time)})`}
                  />
                )),
              );
            })()}
          </Box>
        </Box>

        {/* Labels */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 1,
            fontSize: '0.8rem',
          }}
        >
          <Typography>{formatTime(progress)}</Typography>
          <Typography>{formatTime(duration)}</Typography>
        </Box>
      </Box>

      <Grid
        container
        spacing={1}
        mt={1}
        justifyContent="center"
        alignItems={'center'}
        sx={{ height: 200 }}
      >
        {activeSpecies.length > 0 ? (
          activeSpecies.map((species, index) => (
            <Grid
              key={`${species.species_id}-${species.start_time}-${index}`}
              size={{ md: 2 }}
            >
              <SmallSpeciesCard species={species} />
            </Grid>
          ))
        ) : (
          <Grid>
            <Typography variant="body1">
              No species detected at this moment.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
