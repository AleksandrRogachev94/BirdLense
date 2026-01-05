import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { VideoSpecies, TrackFrame } from '../../../types';
import { labelToUniqueHexColor, getContrastTextColor } from '../../../util';

interface TrackOverlayProps {
  species: VideoSpecies[];
  currentTime: number;
}

/**
 * Renders bounding boxes for detected species tracks synchronized with video playback.
 * Finds the closest stored frame to the current video time and renders boxes at those positions.
 */
export const TrackOverlay: React.FC<TrackOverlayProps> = ({
  species,
  currentTime,
}) => {
  // Find the closest frame for each species detection at current time
  const activeBoxes = useMemo(() => {
    const boxes: Array<{
      key: string;
      speciesName: string;
      trackIndex: number;
      color: string;
      textColor: string;
      bbox: number[];
    }> = [];

    species.forEach((s, idx) => {
      if (!s.frames || s.frames.length === 0) return;

      // Only show boxes during detection time range
      if (currentTime < s.start_time || currentTime > s.end_time) return;

      // Find the closest frame to current time
      let closestFrame: TrackFrame | null = null;
      let minDiff = Infinity;

      for (const frame of s.frames) {
        const diff = Math.abs(frame.t - currentTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestFrame = frame;
        }
      }

      // Only show if within reasonable time threshold (300ms)
      if (closestFrame && minDiff < 0.3) {
        const color = labelToUniqueHexColor(s.species_name);
        boxes.push({
          key: `${s.species_id}-${s.start_time}-${idx}`,
          speciesName: s.species_name,
          trackIndex: idx + 1, // 1-indexed for display
          color,
          textColor: getContrastTextColor(color),
          bbox: closestFrame.bbox,
        });
      }
    });

    return boxes;
  }, [species, currentTime]);

  if (activeBoxes.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {activeBoxes.map((box) => {
        const [x1, y1, x2, y2] = box.bbox;
        return (
          <Box
            key={box.key}
            sx={{
              position: 'absolute',
              left: `${x1 * 100}%`,
              top: `${y1 * 100}%`,
              width: `${(x2 - x1) * 100}%`,
              height: `${(y2 - y1) * 100}%`,
              border: '2px solid',
              borderColor: box.color,
              borderRadius: 0.5,
              boxShadow: `0 0 8px ${box.color}80`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: -20,
                left: 0,
                bgcolor: box.color,
                color: box.textColor,
                px: 0.5,
                borderRadius: 0.5,
                fontSize: '0.65rem',
                whiteSpace: 'nowrap',
              }}
            >
              #{box.trackIndex} {box.speciesName}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};
