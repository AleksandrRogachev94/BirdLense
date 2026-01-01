import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Video, VideoSpecies } from '../../../types';
import { BASE_URL } from '../../../api/api';
import { SmallSpeciesCard } from './SmallSpeciesCard';
import { ProgressBar } from './ProgressBar';
import { SpectrogramPlayer } from './SpectrogramPlayer';
import { useVideoControl } from './useVideoControl';

interface ViewToggleProps {
  view: 'video' | 'audio';
  onChange: (view: 'video' | 'audio') => void;
  audioDisabled: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  view,
  onChange,
  audioDisabled,
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <Tabs value={view} onChange={(_, newView) => onChange(newView)}>
      <Tab label="Video" value="video" />
      <Tab label="Spectrogram" value="audio" disabled={audioDisabled} />
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
          size={{ xs: 6, md: 2 }}
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number>();
  const [view, setView] = useState<'video' | 'audio'>('video');
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const { playing, progress, handleProgress, handleSeek, togglePlayPause } =
    useVideoControl(videoRef);

  const duration = useMemo(
    () =>
      (new Date(video.end_time).getTime() -
        new Date(video.start_time).getTime()) /
      1000,
    [video.end_time, video.start_time],
  );

  const filteredDetections = useMemo(
    () =>
      video.species
        .filter((s) => s.source === view)
        .sort((a, b) => a.start_time - b.start_time),
    [video.species, view],
  );

  const activeDetections = useMemo(
    () =>
      filteredDetections.filter(
        (species) =>
          progress >= species.start_time && progress <= species.end_time,
      ),
    [progress, filteredDetections],
  );

  const startHideTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    if (playing) {
      timeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  }, [playing]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    startHideTimer();
  }, [startHideTimer]);

  const handleTouch = useCallback(() => {
    setShowControls(true);
    startHideTimer();
  }, [startHideTimer]);

  const handleFullscreen = useCallback(() => {
    if (videoRef.current) {
      videoRef.current
        .requestFullscreen()
        .then(() => {
          if (videoRef.current) {
            videoRef.current.controls = true;
          }
        })
        .catch((err) => {
          console.error('Error attempting to enable fullscreen:', err);
        });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && videoRef.current) {
        videoRef.current.controls = false;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Show controls when video is paused
  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    } else {
      startHideTimer();
    }
    // Clean up timeout on unmount
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [playing, startHideTimer]);

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Box>
      <ViewToggle
        view={view}
        onChange={setView}
        audioDisabled={!video.species.some((det) => det.source === 'audio')}
      />

      <Box
        sx={{
          height: isMobile ? '240px' : '400px',
          position: 'relative',
          mt: 1,
        }}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouch}
      >
        {(!playing || showControls) && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: 'white',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.5)',
                transform: 'translate(-50%, -50%) scale(1.1)',
              },
              zIndex: 1,
            }}
          >
            {playing ? (
              <PauseIcon fontSize="medium" />
            ) : (
              <PlayArrowIcon fontSize="medium" />
            )}
          </IconButton>
        )}

        {/* Fullscreen Button */}
        {view === 'video' && (!playing || showControls) && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreen();
            }}
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.5)',
              },
              zIndex: 1,
            }}
          >
            <FullscreenIcon />
          </IconButton>
        )}

        <Box
          sx={{
            height: '100%',
            bgcolor: 'background.paper',
            display: view === 'video' ? 'block' : 'none',
            cursor: 'pointer',
          }}
          onClick={togglePlayPause}
        >
          <video
            ref={videoRef}
            src={`${BASE_URL}/${video.video_path}`}
            onTimeUpdate={(e) => handleProgress(e.currentTarget.currentTime)}
            onEnded={togglePlayPause}
            onError={() => setError('Failed to load video')}
            style={{ height: '100%', width: '100%', objectFit: 'contain' }}
            playsInline
            controls={false}
          />
        </Box>

        <Box
          sx={{
            height: '100%',
            bgcolor: 'background.paper',
            display: view === 'audio' ? 'block' : 'none',
          }}
        >
          <SpectrogramPlayer
            audioRef={videoRef}
            playing={playing}
            imageUrl={`${BASE_URL}/${video.spectrogram_path}`}
            detections={filteredDetections}
            key={view}
          />
        </Box>
      </Box>

      <ProgressBar
        duration={duration}
        progress={progress}
        detections={filteredDetections}
        onSeek={handleSeek}
      />

      <ActiveSpeciesDisplay species={activeDetections} />
    </Box>
  );
};
