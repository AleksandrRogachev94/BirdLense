import React, { useRef, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { VideoSpecies } from '../../../types';
import { labelToUniqueHexColor } from '../../../util';

interface ProgressBarProps {
  duration: number;
  progress: number;
  onSeek: (time: number) => void;
  detections: VideoSpecies[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  duration,
  progress,
  onSeek,
  detections,
}) => {
  const theme = useTheme();
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgressBarSeek = useCallback(
    (event: React.MouseEvent) => {
      if (progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const seekPosition = (event.clientX - rect.left) / rect.width;
        const seekTime = seekPosition * duration;
        onSeek(seekTime);
      }
    },
    [duration, onSeek],
  );

  const detectionLayers = useMemo(() => {
    const layers: Array<
      Array<{
        species: (typeof detections)[0];
        startPercentage: number;
        endPercentage: number;
        width: number;
      }>
    > = [];

    detections.forEach((species) => {
      const startPercentage = Math.min(
        (species.start_time / duration) * 100,
        100,
      );
      const endPercentage = Math.min((species.end_time / duration) * 100, 100);
      const width = Math.min(
        endPercentage - startPercentage,
        100 - startPercentage,
      );

      let layerIndex = layers.findIndex(
        (layer) =>
          !layer.some(
            (existingDetection) =>
              !(
                endPercentage <= existingDetection.startPercentage ||
                startPercentage >= existingDetection.endPercentage
              ),
          ),
      );

      if (layerIndex === -1) {
        layerIndex = layers.length;
        layers.push([]);
      }

      layers[layerIndex].push({
        species,
        startPercentage,
        endPercentage,
        width,
      });
    });

    return layers;
  }, [detections, duration]);

  return (
    <Box sx={{ position: 'relative', mt: 2 }}>
      <Box display="flex" alignItems="center">
        <Box
          ref={progressBarRef}
          onClick={handleProgressBarSeek}
          sx={{
            position: 'relative',
            height: `${Math.max(detectionLayers.length * 12, 12)}px`,
            backgroundColor: 'white',
            borderRadius: '4px',
            flexGrow: 1,
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
            cursor: 'pointer',
          }}
        >
          {/* Played Section */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${(progress / duration) * 100}%`,
              backgroundColor: theme.palette.grey[600],
              zIndex: 1,
            }}
          />

          {/* Detection Markers */}
          {detectionLayers.flatMap((layer, layerIdx) =>
            layer.map((detection, index) => (
              <Box
                key={`${layerIdx}-${index}`}
                sx={{
                  position: 'absolute',
                  left: `${detection.startPercentage}%`,
                  top: `${layerIdx * 12}px`,
                  height: '10px',
                  width: `${detection.width}%`,
                  backgroundColor: labelToUniqueHexColor(
                    detection.species.species_name,
                  ),
                  opacity: 0.5,
                  zIndex: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 0.8,
                    transform: 'scaleY(1.2)',
                    boxShadow: `0 0 8px ${labelToUniqueHexColor(
                      detection.species.species_name,
                    )}`,
                    zIndex: 3,
                  },
                }}
                title={`${detection.species.species_name} (${formatTime(
                  detection.species.start_time,
                )} - ${formatTime(detection.species.end_time)})`}
              />
            )),
          )}
        </Box>
      </Box>

      {/* Time Labels */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 1,
          fontSize: '0.8rem',
        }}
      >
        <Typography>{formatTime(progress)}</Typography>
        <Typography>{formatTime(duration)}</Typography>
      </Box>
    </Box>
  );
};
