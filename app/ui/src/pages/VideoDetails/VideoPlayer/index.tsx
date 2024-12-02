import React, { useRef, useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import ReactPlayer from 'react-player';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { Video } from '../../../types';
import { BASE_URL } from '../../../api/api';
import { SmallSpeciesCard } from './SmallSpeciesCard';
import { ProgressBar } from './ProgressBar';

// Main Video Player Component
export const VideoPlayer: React.FC<{ video: Video }> = ({ video }) => {
  const videoRef = useRef<ReactPlayer | null>(null);
  const audioRef = useRef<ReactPlayer | null>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

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
    audioRef.current?.seekTo(time, 'seconds');
    setProgress(time);
  }, []);

  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  return (
    <Box>
      {/* Video and Audio Players */}
      <VideoPlayerDisplay
        video={video}
        playing={playing}
        onTogglePlayPause={togglePlayPause}
        videoRef={videoRef}
        audioRef={audioRef}
        onProgress={handleProgress}
      />

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

// Video Player Display Subcomponent
interface VideoPlayerDisplayProps {
  video: Video;
  playing: boolean;
  onTogglePlayPause: () => void;
  videoRef: React.RefObject<ReactPlayer>;
  audioRef: React.RefObject<ReactPlayer>;
  onProgress: (state: { playedSeconds: number }) => void;
}

const VideoPlayerDisplay: React.FC<VideoPlayerDisplayProps> = ({
  video,
  playing,
  onTogglePlayPause,
  videoRef,
  audioRef,
  onProgress,
}) => (
  <Box height={500} position="relative">
    <ReactPlayer
      ref={videoRef}
      url={`${BASE_URL}/${video.video_path}`}
      playing={playing}
      controls={false}
      onProgress={onProgress}
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
      onClick={onTogglePlayPause}
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
);

export default VideoPlayer;
