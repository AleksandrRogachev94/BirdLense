import { useCallback, useEffect, useState } from 'react';

export const useVideoControl = (
  videoRef: React.RefObject<HTMLVideoElement>,
) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProgress = useCallback((seconds: number) => {
    setProgress(seconds);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
    setProgress(time);
  }, []);

  const togglePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [playing]);

  return { playing, progress, handleProgress, handleSeek, togglePlayPause };
};
