import { useRef, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
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
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);

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
    if (audioRef.current) {
      audioRef.current.seekTo(state.playedSeconds, 'seconds');
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.seekTo(time, 'seconds');
      setProgress(time);
    }
    if (audioRef.current) {
      audioRef.current.seekTo(time, 'seconds');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Box>
      {/* Video Player */}
      <Box height={500}>
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
      </Box>

      {/* Progress Bar */}
      <Box sx={{ position: 'relative' }}>
        <Box display="flex" alignItems="center">
          {/* Play/Stop Icon Button */}
          <IconButton color="primary" onClick={() => setPlaying(!playing)}>
            {playing ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayArrowIcon fontSize="large" />
            )}
          </IconButton>

          <Box
            sx={{
              position: 'relative',
              height: '8px',
              backgroundColor: theme.palette.grey[400],
              borderRadius: '4px',
              flexGrow: 1,
              ml: 2,
            }}
          >
            {/* Current Progress */}
            <Box
              sx={{
                width: `${(progress / duration) * 100}%`,
                height: '100%',
                backgroundColor: theme.palette.grey[700],
                borderRadius: '4px',
              }}
            />

            {/* Detection Markers */}
            {video.species.map((species, index) => {
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

              return (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    left: `${startPercentage}%`,
                    top: '0',
                    bottom: '0',
                    width: `${width}%`,
                    backgroundColor: labelToUniqueHexColor(
                      species.species_name,
                    ),
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSeek(species.start_time)}
                  title={species.species_name}
                />
              );
            })}

            {/* Slider */}
            <Slider
              value={progress}
              onChange={(_, value) => handleSeek(value as number)}
              max={duration}
              sx={{
                position: 'absolute',
                top: '-10px',
                width: '100%',
                color: 'transparent',
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.palette.grey[700],
                },
              }}
            />
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
            <Grid key={species.species_id} size={{ md: 2 }}>
              <SmallSpeciesCard key={index} species={species} />
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
