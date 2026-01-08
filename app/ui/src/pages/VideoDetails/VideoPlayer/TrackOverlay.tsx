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
 * Renders bounding boxes and trajectory trails for detected species tracks.
 * Shows full movement path as a solid line with a dot at current position.
 */
export const TrackOverlay: React.FC<TrackOverlayProps> = ({
  species,
  currentTime,
}) => {
  const { boxes, trails } = useMemo(() => {
    const boxes: Array<{
      key: string;
      speciesName: string;
      trackIndex: number;
      color: string;
      textColor: string;
      bbox: number[];
    }> = [];

    const trails: Array<{
      key: string;
      color: string;
      points: string;
      lastCenter: [number, number];
    }> = [];

    species.forEach((s, idx) => {
      if (!s.frames || s.frames.length === 0) return;
      if (currentTime < s.start_time || currentTime > s.end_time) return;

      const color = labelToUniqueHexColor(s.species_name);

      // Build trail from frames up to current time
      const trailFrames = s.frames.filter((f) => f.t <= currentTime + 0.1);
      if (trailFrames.length > 0) {
        // Convert bbox centers to SVG coordinates (160x90 viewBox for 16:9)
        const centers = trailFrames.map((f) => {
          const [x1, y1, x2, y2] = f.bbox;
          return `${((x1 + x2) / 2) * 160},${((y1 + y2) / 2) * 90}`;
        });
        const last = trailFrames[trailFrames.length - 1].bbox;

        trails.push({
          key: `trail-${s.species_id}-${s.start_time}-${idx}`,
          color,
          points: centers.join(' '),
          lastCenter: [
            ((last[0] + last[2]) / 2) * 160,
            ((last[1] + last[3]) / 2) * 90,
          ],
        });
      }

      // Find closest frame for bounding box
      let closestFrame: TrackFrame | null = null;
      let minDiff = Infinity;
      for (const frame of s.frames) {
        const diff = Math.abs(frame.t - currentTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestFrame = frame;
        }
      }

      if (closestFrame && minDiff < 0.3) {
        boxes.push({
          key: `box-${s.species_id}-${s.start_time}-${idx}`,
          speciesName: s.species_name,
          trackIndex: s.track_id ?? idx + 1,
          color,
          textColor: getContrastTextColor(color),
          bbox: closestFrame.bbox,
        });
      }
    });

    return { boxes, trails };
  }, [species, currentTime]);

  if (boxes.length === 0 && trails.length === 0) return null;

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
      {/* Trajectory trails */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        viewBox="0 0 160 90"
        preserveAspectRatio="none"
      >
        {trails.map((trail) => (
          <g key={trail.key}>
            <polyline
              points={trail.points}
              fill="none"
              stroke={trail.color}
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <circle
              cx={trail.lastCenter[0]}
              cy={trail.lastCenter[1]}
              r={0.8}
              fill={trail.color}
            />
          </g>
        ))}
      </svg>

      {/* Bounding boxes */}
      {boxes.map((box) => {
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
