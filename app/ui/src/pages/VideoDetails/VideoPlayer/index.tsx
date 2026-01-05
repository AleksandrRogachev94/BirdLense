import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Video, VideoSpecies } from '../../../types';
import { BASE_URL } from '../../../api/api';
import { ProgressBar } from './ProgressBar';
import { SpectrogramPlayer } from './SpectrogramPlayer';
import { useVideoControl } from './useVideoControl';
import { TrackOverlay } from './TrackOverlay';

interface ViewToggleProps {
  view: 'video' | 'audio';
  onChange: (view: 'video' | 'audio') => void;
  audioDisabled: boolean;
}

interface VideoPlayerProps {
  video: Video;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  view,
  onChange,
  audioDisabled,
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: 16,
      left: 16,
      zIndex: 10,
      bgcolor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 1,
      backdropFilter: 'blur(4px)',
    }}
  >
    <Tabs
      value={view}
      onChange={(_, newView) => onChange(newView)}
      sx={{
        minHeight: 'auto',
        '& .MuiTab-root': {
          minHeight: 32,
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-selected': {
            color: 'white',
          },
        },
        '& .MuiTabs-indicator': {
          backgroundColor: 'primary.main',
        },
      }}
    >
      <Tab label="Video" value="video" sx={{ py: 0.5, px: 2 }} />
      <Tab
        label="Spectrogram"
        value="audio"
        disabled={audioDisabled}
        sx={{ py: 0.5, px: 2 }}
      />
    </Tabs>
  </Box>
);

// Compact overlay for active species detection
interface CompactDetectionOverlayProps {
  species: VideoSpecies[];
}

const CompactDetectionOverlay: React.FC<CompactDetectionOverlayProps> = ({
  species,
}) => {
  if (species.length === 0) {
    return null;
  }

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          maxWidth: { xs: '50%' },
        }}
      >
        {species.map((s, index) => (
          <Box
            key={`${s.species_id}-${s.start_time}-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: 'white',
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                maxWidth: { xs: 120, sm: 200 },
              }}
            >
              {s.species_name}
            </Typography>
            <Chip
              label={`${Math.round(s.confidence * 100)}%`}
              size="small"
              color="primary"
              sx={{
                height: { xs: 18, sm: 20 },
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                flexShrink: 0,
              }}
            />
          </Box>
        ))}
      </Box>
    </Fade>
  );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number>();
  const [view, setView] = useState<'video' | 'audio'>('video');
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showTracks, setShowTracks] = useState(false);

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

  // Get video detections that have track frames data
  const trackDetections = useMemo(
    () =>
      video.species.filter(
        (s) => s.source === 'video' && s.frames && s.frames.length > 0,
      ),
    [video.species],
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
      <Box
        sx={{
          width: '100%',
          aspectRatio: '16 / 9', // Enforce 16:9 aspect ratio
          position: 'relative',
          mt: 0, // Removed top margin for cleaner alignment
        }}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouch}
      >
        {/* Overlay Tabs */}
        {showControls && (
          <ViewToggle
            view={view}
            onChange={setView}
            audioDisabled={!video.species.some((det) => det.source === 'audio')}
          />
        )}

        {/* Tracks Toggle - show only in video view */}
        {showControls && view === 'video' && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 1,
              backdropFilter: 'blur(4px)',
              px: 1.5,
              py: 0.5,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showTracks}
                  onChange={(e) => setShowTracks(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-thumb': { width: 14, height: 14 },
                    '& .MuiSwitch-switchBase': { padding: '6px' },
                  }}
                />
              }
              label="Tracks"
              sx={{
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem',
                  ml: 0.5,
                },
              }}
            />
          </Box>
        )}

        {/* Track Bounding Box Overlay */}
        {showTracks && view === 'video' && trackDetections.length > 0 && (
          <TrackOverlay species={trackDetections} currentTime={progress} />
        )}

        {/* Active Species Overlay */}
        <CompactDetectionOverlay species={activeDetections} />

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
              backgroundColor: 'rgba(0,0,0,0.3)', // Consistent with other overlays
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
    </Box>
  );
};
