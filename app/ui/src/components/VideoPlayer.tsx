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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReactPlayer from 'react-player';
import { Video, VideoSpecies } from '../types';
import { labelToUniqueHexColor } from '../util';
import { BASE_URL } from '../api/api';

const SmallSpeciesCard = ({ species }: { species: VideoSpecies }) => {
  return (
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
        <Typography gutterBottom variant="h6" component="div">
          {species.species_name}
        </Typography>
        <Box display="flex" gap={1} mt={1}>
          <Chip
            label={`${Math.round(species.confidence * 100)}%`}
            size="small"
            color="success"
          />
          <Chip label={species.source} size="small" />
        </Box>
      </CardContent>
    </Card>
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
          url={`${BASE_URL}/files/${video.video_path}`}
          playing={playing}
          controls={false}
          onProgress={handleProgress}
          height="100%"
          width="100%"
        />
        <ReactPlayer
          ref={audioRef}
          url={`${BASE_URL}/files/${video.audio_path}`}
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
            {video.species.map((species, index) => (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  left: `${(species.start_time / duration) * 100}%`,
                  top: '0',
                  bottom: '0',
                  width: `${((species.end_time - species.start_time) / duration) * 100}%`,
                  backgroundColor: labelToUniqueHexColor(species.species_name),
                  cursor: 'pointer',
                }}
                onClick={() => handleSeek(species.start_time)}
                title={species.species_name}
              />
            ))}

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
            <Grid key={species.species_id}>
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
