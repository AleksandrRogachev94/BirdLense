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
import ReactPlayer from 'react-player';
import { Video, VideoSpecies } from '../types';
import { labelToUniqueHexColor } from '../util';

const SmallSpeciesCard = ({ species }: { species: VideoSpecies }) => {
  return (
    <Card sx={{ height: 200 }}>
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
  const playerRef = useRef<ReactPlayer | null>(null);
  const [progress, setProgress] = useState(0);

  const duration =
    new Date(video.end_time).getTime() / 1000 -
    new Date(video.start_time).getTime() / 1000;

  const speciesDetections = useMemo(
    () =>
      video.species.map((species) => ({
        ...species,
        start:
          new Date(species.start_time).getTime() / 1000 -
          new Date(video.start_time).getTime() / 1000,
        end:
          new Date(species.end_time).getTime() / 1000 -
          new Date(video.start_time).getTime() / 1000,
      })),
    [video.species, video.start_time],
  );

  const activeSpecies = useMemo(
    () =>
      speciesDetections.filter(
        (detection) => progress >= detection.start && progress <= detection.end,
      ),
    [progress, speciesDetections],
  );

  const handleProgress = (state: { playedSeconds: number }) => {
    setProgress(state.playedSeconds);
  };

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, 'seconds');
      setProgress(time);
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
          ref={playerRef}
          url={video.video_path}
          playing={true}
          controls={false}
          onProgress={handleProgress}
          height="100%"
          width="100%"
        />
      </Box>

      {/* Progress Bar */}
      <Box sx={{ position: 'relative', mt: 2 }}>
        <Box
          sx={{
            position: 'relative',
            height: '8px',
            backgroundColor: theme.palette.grey[400],
            borderRadius: '4px',
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
          {speciesDetections.map((detection, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: `${(detection.start / duration) * 100}%`,
                top: '0',
                bottom: '0',
                width: `${((detection.end - detection.start) / duration) * 100}%`,
                backgroundColor: labelToUniqueHexColor(detection.species_name),
                cursor: 'pointer',
              }}
              onClick={() => handleSeek(detection.start)}
              title={detection.species_name}
            />
          ))}
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
