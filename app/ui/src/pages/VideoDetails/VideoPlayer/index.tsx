import React, { useRef, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Video, VideoSpecies } from '../../../types';
import { BASE_URL } from '../../../api/api';
import { SmallSpeciesCard } from './SmallSpeciesCard';
import { ProgressBar } from './ProgressBar';
import { SpectrogramPlayer } from './SpectrogramPlayer';
import { useVideoControl } from './useVideoControl';

interface ViewToggleProps {
  view: 'video' | 'audio';
  onChange: (view: 'video' | 'audio') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onChange }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <Tabs value={view} onChange={(_, newView) => onChange(newView)}>
      <Tab label="Video" value="video" />
      <Tab label="Audio" value="audio" />
    </Tabs>
  </Box>
);

interface ActiveSpeciesDisplayProps {
  species: VideoSpecies[];
}

const ActiveSpeciesDisplay: React.FC<ActiveSpeciesDisplayProps> = ({
  species,
}) => (
  <Grid
    container
    spacing={1}
    mt={1}
    justifyContent="center"
    alignItems="center"
    sx={{ height: 200 }}
  >
    {species.length > 0 ? (
      species.map((species, index) => (
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
);

export const VideoPlayer: React.FC<{ video: Video }> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [view, setView] = useState<'video' | 'audio'>('video');
  const [error, setError] = useState<string | null>(null);

  const { playing, progress, handleProgress, handleSeek, togglePlayPause } =
    useVideoControl(videoRef);

  const duration = useMemo(
    () =>
      (new Date(video.end_time).getTime() -
        new Date(video.start_time).getTime()) /
      1000,
    [video.end_time, video.start_time],
  );

  const activeSpecies = useMemo(
    () =>
      video.species.filter(
        (species) =>
          progress >= species.start_time && progress <= species.end_time,
      ),
    [progress, video.species],
  );

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Box>
      <ViewToggle view={view} onChange={setView} />

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
          <video
            ref={videoRef}
            src={`${BASE_URL}/${video.video_path}`}
            onTimeUpdate={(e) => handleProgress(e.currentTarget.currentTime)}
            onEnded={togglePlayPause}
            onError={() => setError('Failed to load video')}
            style={{ height: '100%', width: '100%' }}
          />
        </Box>

        <Box
          sx={{
            height: '100%',
            bgcolor: 'background.paper',
            display: view === 'audio' ? 'default' : 'none',
          }}
        >
          <SpectrogramPlayer
            audioRef={videoRef}
            playing={playing}
            imageUrl={`${BASE_URL}/${video.spectrogram_path}`}
            detections={video.species}
            key={view}
          />
        </Box>
      </Box>

      <ProgressBar
        duration={duration}
        progress={progress}
        video={video}
        onSeek={handleSeek}
        view={view}
      />

      <ActiveSpeciesDisplay species={activeSpecies} />
    </Box>
  );
};
