import { useRef, useState } from 'react';
import { Video } from '../types';
import { Box, Slider, Typography, useTheme } from '@mui/material';
import ReactPlayer from 'react-player';

export const VideoPlayer = ({ video }: { video: Video }) => {
  const theme = useTheme();
  const playerRef = useRef<ReactPlayer | null>(null);
  const [progress, setProgress] = useState(0);

  const duration =
    new Date(video.end_time).getTime() / 1000 -
    new Date(video.start_time).getTime() / 1000;

  const speciesDetections = video.species.map((species) => ({
    label: species.species_name,
    start:
      new Date(species.start_time).getTime() / 1000 -
      new Date(video.start_time).getTime() / 1000,
    end:
      new Date(species.end_time).getTime() / 1000 -
      new Date(video.start_time).getTime() / 1000,
  }));

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
      <Box height={600}>
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

      <Box sx={{ position: 'relative', mt: 2 }}>
        {/* Progress Bar */}
        <Box
          sx={{
            position: 'relative',
            height: '8px',
            backgroundColor: '#ccc',
            borderRadius: '4px',
          }}
        >
          {/* Current Progress */}
          <Box
            sx={{
              width: `${(progress / duration) * 100}%`,
              height: '100%',
              backgroundColor: theme.palette.primary.main,
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
                backgroundColor: theme.palette.secondary.main,
                cursor: 'pointer',
              }}
              onClick={() => handleSeek(detection.start)}
              title={detection.label}
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
            color: 'transparent', // Hides default slider color
            '& .MuiSlider-thumb': {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        />
      </Box>
    </Box>
  );
};
