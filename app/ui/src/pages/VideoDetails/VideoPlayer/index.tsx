import React, { useRef, useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import ReactPlayer from 'react-player';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Video } from '../../../types';
import { BASE_URL } from '../../../api/api';
import { SmallSpeciesCard } from './SmallSpeciesCard';
import { ProgressBar } from './ProgressBar';
import { SpectrogramPlayer } from './SpectrogramPlayer';

// Main Video Player Component
export const VideoPlayer: React.FC<{ video: Video }> = ({ video }) => {
  const videoRef = useRef<ReactPlayer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [view, setView] = useState<'video' | 'spectrogram'>('video');

  const duration =
    (new Date(video.end_time).getTime() -
      new Date(video.start_time).getTime()) /
    1000;

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
    videoRef.current?.seekTo(time, 'seconds');
    // audioRef.current?.seekTo(time, 'seconds');
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setProgress(time);
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [playing]);

  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  return (
    <Box>
      <audio
        src={`${BASE_URL}/${video.audio_path}`}
        style={{ height: 0, width: 0 }}
        ref={audioRef}
      />
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Tabs
            value={view}
            onChange={(_, newView) => setView(newView)}
            aria-label="basic tabs example"
          >
            <Tab label="Video" value="video" />
            <Tab label="Spectrogram" value="spectrogram" />
          </Tabs>
        </Box>

        <Box sx={{ height: 500, position: 'relative' }}>
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
              zIndex: 1,
            }}
          >
            {playing ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayArrowIcon fontSize="large" />
            )}
          </IconButton>

          <Box
            sx={{
              height: '100%',
              bgcolor: 'background.paper',
              display: view === 'video' ? 'default' : 'none',
            }}
          >
            <ReactPlayer
              ref={videoRef}
              url={`${BASE_URL}/${video.video_path}`}
              playing={playing}
              controls={false}
              onProgress={handleProgress}
              height="100%"
              width="100%"
              onEnded={togglePlayPause}
            />
          </Box>
          <Box
            sx={{
              height: '100%',
              bgcolor: 'background.paper',
              display: view === 'spectrogram' ? 'default' : 'none',
            }}
          >
            <SpectrogramPlayer audioRef={audioRef} playing={playing} />
          </Box>
        </Box>
      </Box>

      {/* Progress Bar */}
      <ProgressBar
        duration={duration}
        progress={progress}
        video={video}
        onSeek={handleSeek}
      />

      {/* Active Species Display */}
      <Grid
        container
        spacing={1}
        mt={1}
        justifyContent="center"
        alignItems="center"
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
