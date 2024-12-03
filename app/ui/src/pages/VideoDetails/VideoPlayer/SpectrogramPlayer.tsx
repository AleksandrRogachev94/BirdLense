import React, { useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { SelectChangeEvent } from '@mui/material';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  colorSchemes,
  FFT_SIZE,
  SCROLL_STEP,
  SMOOTHING_TIME_CONSTANT,
} from './constants';

interface SpectrogramPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  playing: boolean;
}

interface AudioNodes {
  context: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
}

export const SpectrogramPlayer: React.FC<SpectrogramPlayerProps> = ({
  audioRef,
  playing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioNodesRef = useRef<AudioNodes | null>(null);
  const animationRef = useRef<number | null>(null);
  const [colorScheme, setColorScheme] = React.useState<string>('jet');

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = colorSchemes[colorScheme].backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [colorScheme]);

  const cleanupAudioNodes = useCallback(() => {
    if (audioNodesRef.current) {
      const { context, source, analyser } = audioNodesRef.current;
      source.disconnect();
      analyser.disconnect();
      context.close();
      audioNodesRef.current = null;
    }
  }, []);

  const initializeAudioNodes = useCallback(() => {
    if (!audioRef.current || audioNodesRef.current) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;

    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioNodesRef.current = { context: audioContext, analyser, source };
  }, [audioRef]);

  const drawSpectrogram = useCallback(() => {
    const canvas = canvasRef.current;
    const audioNodes = audioNodesRef.current;

    if (!canvas || !audioNodes) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { analyser } = audioNodes;
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    // Scroll existing content
    const imageData = ctx.getImageData(
      SCROLL_STEP,
      0,
      canvas.width - SCROLL_STEP,
      canvas.height,
    );
    ctx.putImageData(imageData, 0, 0);

    // Clear the rightmost strip
    ctx.fillStyle = colorSchemes[colorScheme].backgroundColor;
    ctx.fillRect(canvas.width - SCROLL_STEP, 0, SCROLL_STEP, canvas.height);

    // Draw new frequency data
    freqData.forEach((value, i) => {
      const normalizedValue = Math.pow(value / 255, 0.7);
      const color = colorSchemes[colorScheme].fn(normalizedValue);
      const y = Math.floor((i / freqData.length) * canvas.height);

      ctx.fillStyle = color;
      ctx.fillRect(
        canvas.width - SCROLL_STEP,
        canvas.height - y - 1,
        SCROLL_STEP,
        1,
      );
    });

    animationRef.current = requestAnimationFrame(drawSpectrogram);
  }, [colorScheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      cleanupAudioNodes();
    };
  }, [cleanupAudioNodes]);

  useEffect(() => {
    if (playing) {
      initializeAudioNodes();
      drawSpectrogram();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [playing, initializeAudioNodes, drawSpectrogram]);

  useEffect(() => {
    clearCanvas();
  }, [colorScheme, clearCanvas]);

  const handleColorSchemeChange = (event: SelectChangeEvent) => {
    setColorScheme(event.target.value);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'black',
      }}
    >
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colorSchemes[colorScheme].backgroundColor,
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            bgcolor: 'background.paper',
            borderRadius: 1,
          }}
        >
          <InputLabel>Color Scheme</InputLabel>
          <Select
            value={colorScheme}
            label="Color Scheme"
            onChange={handleColorSchemeChange}
          >
            {Object.entries(colorSchemes).map(([key, scheme]) => (
              <MenuItem key={key} value={key}>
                {scheme.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};
