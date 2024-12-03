import React, { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { SelectChangeEvent } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

const colorSchemes: Record<string, ColorScheme> = {
  jet: {
    name: 'Jet',
    backgroundColor: 'rgb(0, 0, 127)',
    fn: (v: number) => {
      if (v < 0.25) return `rgb(0, 0, ${Math.floor(127 + 128 * (4 * v))})`;
      if (v < 0.5) return `rgb(0, ${Math.floor(255 * (4 * (v - 0.25)))}, 255)`;
      if (v < 0.75)
        return `rgb(${Math.floor(255 * (4 * (v - 0.5)))}, 255, ${Math.floor(255 * (1 - 4 * (v - 0.5)))})`;
      return `rgb(255, ${Math.floor(255 * (1 - 4 * (v - 0.75)))}, 0)`;
    },
  },
  hot: {
    name: 'Hot',
    backgroundColor: 'rgb(0, 0, 0)',
    fn: (v: number) => {
      const val = Math.min(v * 1.5, 1);
      return `rgb(${Math.floor(255 * val)}, ${Math.floor(127 * val)}, 0)`;
    },
  },
  grayscale: {
    name: 'Grayscale',
    backgroundColor: 'rgb(0, 0, 0)',
    fn: (v: number) => {
      const intensity = Math.floor(255 * Math.pow(v, 0.5));
      return `rgb(${intensity}, ${intensity}, ${intensity})`;
    },
  },
};

interface SpectrogramPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  playing: boolean;
}

interface ColorScheme {
  name: string;
  fn: (value: number) => string;
  backgroundColor: string;
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

  const FFT_SIZE = 2048;
  const CANVAS_HEIGHT = 400; // Match video height
  const CANVAS_WIDTH = 800;
  const SCROLL_STEP = 1;

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = colorSchemes[colorScheme].backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const cleanupDrawSpectrogram = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const cleanupAudio = () => {
    if (audioNodesRef.current) {
      const { context, source, analyser } = audioNodesRef.current;
      source.disconnect();
      analyser.disconnect();
      context.close();
      audioNodesRef.current = null;
    }
  };

  const initializeAudioNodes = () => {
    if (!audioRef.current) return; // audio not available
    if (audioNodesRef.current) return; // already initialized

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.2;

    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioNodesRef.current = { context: audioContext, analyser, source };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    return () => {
      cleanupDrawSpectrogram();
      cleanupAudio();
    };
  }, []);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      initializeAudioNodes();
      drawSpectrogram();
    } else {
      cleanupDrawSpectrogram();
    }
  }, [playing]);

  useEffect(() => {
    clearCanvas();
  }, [colorScheme]);

  const drawSpectrogram = () => {
    const canvas = canvasRef.current;
    const audioNodes = audioNodesRef.current;

    if (!canvas || !audioNodes) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { analyser } = audioNodes;
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    // Scroll the existing spectrogram left
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
    for (let i = 0; i < freqData.length; i++) {
      const value = Math.pow(freqData[i] / 255.0, 0.7);
      const color = colorSchemes[colorScheme].fn(value);
      const y = Math.floor((i / freqData.length) * canvas.height);

      ctx.fillStyle = color;
      ctx.fillRect(
        canvas.width - SCROLL_STEP,
        canvas.height - y - 1,
        SCROLL_STEP,
        1,
      );
    }

    animationRef.current = requestAnimationFrame(drawSpectrogram);
  };

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

export default SpectrogramPlayer;
