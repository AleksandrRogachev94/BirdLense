import { useCallback, useEffect, useState } from 'react';

export const useVideoAudioSync = (
  videoRef: React.RefObject<HTMLVideoElement>,
  audioRef: React.RefObject<HTMLAudioElement>,
) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProgress = useCallback((seconds: number) => {
    setProgress(seconds);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
    if (audioRef.current) audioRef.current.currentTime = time;
    setProgress(time);
  }, []);

  const togglePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (!audio || !video) return;

    if (playing) {
      Promise.all([
        audio.play().catch(console.error),
        video.play().catch(console.error),
      ]);
    } else {
      audio.pause();
      video.pause();
    }
  }, [playing]);

  return { playing, progress, handleProgress, handleSeek, togglePlayPause };
};
