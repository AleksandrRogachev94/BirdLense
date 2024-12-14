import React, { useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import { VideoSpecies } from '../../../types';
import { labelToUniqueHexColor } from '../../../util';

const DEFAULT_PX_PER_SECOND = 200;

const extractPxPerSecond = (imageUrl: string): number => {
  const match = imageUrl.match(/spectrogram_(\d+)\.jpg$/);
  return match ? parseInt(match[1], 10) : DEFAULT_PX_PER_SECOND;
};

interface SpectrogramPlayerProps {
  imageUrl: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  playing: boolean;
  detections: VideoSpecies[];
}

export const SpectrogramPlayer: React.FC<SpectrogramPlayerProps> = ({
  imageUrl,
  audioRef,
  playing,
  detections,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const pxPerSecond = extractPxPerSecond(imageUrl);

  const drawSpectrogram = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !audioRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTime = audioRef.current.currentTime;
    const currentPx = currentTime * pxPerSecond;
    const halfWidth = canvas.width / 2;

    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw spectrogram
    ctx.drawImage(
      image,
      currentPx - halfWidth,
      0,
      canvas.width,
      image.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Draw detections at the bottom
    detections.forEach((detection) => {
      const startPx =
        detection.start_time * pxPerSecond - currentPx + halfWidth;
      const width = (detection.end_time - detection.start_time) * pxPerSecond;
      const color = labelToUniqueHexColor(detection.species_name);

      const barHeight = 30;
      const barY = canvas.height - barHeight;

      // Detection bar with background
      ctx.fillStyle = `${color}20`;
      ctx.fillRect(startPx, barY, width, barHeight);

      // Top border
      ctx.fillStyle = color;
      ctx.fillRect(startPx, barY, width, 2);

      // Species name
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        detection.species_name,
        startPx + width / 2,
        canvas.height - 10,
      );
    });

    // Playhead line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, canvas.height);
    ctx.stroke();
  }, [pxPerSecond, detections, imageUrl]);

  const drawSpectrogramAnimate = useCallback(() => {
    drawSpectrogram();
    animationRef.current = requestAnimationFrame(drawSpectrogramAnimate);
  }, [drawSpectrogram]);

  useEffect(() => {
    // Load spectrogram image
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      if (canvasRef.current) {
        canvasRef.current.height = image.height;
      }
      drawSpectrogram();
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [drawSpectrogram, imageUrl]);

  useEffect(() => {
    // This effect is needed for seeking when paused since animation is off
    const audio = audioRef.current;
    if (!audio) return;
    const handleSeeked = () => {
      drawSpectrogram();
    };
    audio.addEventListener('seeked', handleSeeked);
    return () => {
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [drawSpectrogram]);

  useEffect(() => {
    if (playing) {
      drawSpectrogramAnimate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [playing, drawSpectrogramAnimate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;
    // ResizeObserver to watch for changes in the parent's size
    const resizeObserver = new ResizeObserver(() => {
      if (parent && canvas) {
        canvas.width = parent.offsetWidth;
        drawSpectrogram();
      }
    });
    // Observe the parent container for size changes
    if (parent) {
      resizeObserver.observe(parent);
    }
    // Clean up the observer on component unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <Box
      sx={{ height: '100%', width: '100%', bgcolor: 'black' }}
      ref={parentRef}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
        }}
      />
    </Box>
  );
};