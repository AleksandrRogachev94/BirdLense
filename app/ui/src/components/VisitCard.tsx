import { useState } from 'react';
import type { SpeciesVisit } from '../types';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import AccessTime from '@mui/icons-material/AccessTime';
import Thermostat from '@mui/icons-material/Thermostat';
import Groups from '@mui/icons-material/Groups';
import VideoCall from '@mui/icons-material/VideoCall';
import Mic from '@mui/icons-material/Mic';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const DetectionItem = ({
  detection,
  onClick,
  isLastInGroup,
}: {
  detection: SpeciesVisit['detections'][0];
  onClick: () => void;
  isLastInGroup: boolean;
}) => {
  const theme = useTheme();

  return (
    <Box>
      <CardActionArea
        onClick={onClick}
        sx={{
          p: 1.5,
          borderRadius: 1,
          backgroundColor: theme.palette.action.hover,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box display="flex" alignItems="center">
            {detection.source === 'video' ? (
              <VideoCall color="primary" fontSize="small" />
            ) : (
              <Mic color="secondary" fontSize="small" />
            )}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 65 }}
          >
            {new Date(detection.start_time).toLocaleTimeString()}
          </Typography>
          <Chip
            label={`${Math.round(detection.confidence * 100)}%`}
            size="small"
            color={detection.source === 'video' ? 'primary' : 'secondary'}
            sx={{
              height: 24,
              '& .MuiChip-label': { px: 1, fontSize: '0.75rem' },
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 'auto' }}
          >
            {Math.round(
              (new Date(detection.end_time).getTime() -
                new Date(detection.start_time).getTime()) /
                1000,
            )}
            s
          </Typography>
        </Box>
      </CardActionArea>
      {isLastInGroup && <Box mx={1.5} my={1} />}
    </Box>
  );
};

const groupDetectionsByVideo = (detections: SpeciesVisit['detections']) => {
  return detections.reduce<SpeciesVisit['detections'][]>((acc, detection) => {
    if (
      acc.length === 0 ||
      acc[acc.length - 1][0].video_id !== detection.video_id
    ) {
      acc.push([detection]);
    } else {
      acc[acc.length - 1].push(detection);
    }
    return acc;
  }, []);
};

export interface VisitCardProps {
  visit: SpeciesVisit;
  compact?: boolean;
}

export const VisitCard = ({ visit, compact = false }: VisitCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar
            src={visit.species.image_url}
            sx={{
              width: compact ? 44 : 48,
              height: compact ? 44 : 48,
            }}
          />
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant={compact ? 'body1' : 'h6'}
                component="div"
                sx={{
                  flex: 1,
                  lineHeight: compact ? 1.4 : 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {visit.species.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ mt: -0.5 }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Box display="flex" gap={1.5} mt={1.5} flexWrap="nowrap">
              <Chip
                icon={
                  <Box display="flex" alignItems="center">
                    <Groups sx={{ fontSize: 18 }} />
                  </Box>
                }
                label={visit.max_simultaneous}
                size="small"
                sx={{ height: 28 }}
              />
              <Chip
                icon={
                  <Box display="flex" alignItems="center">
                    <AccessTime sx={{ fontSize: 18 }} />
                  </Box>
                }
                label={`${Math.round(
                  (new Date(visit.end_time).getTime() -
                    new Date(visit.start_time).getTime()) /
                    1000,
                )}s`}
                size="small"
                sx={{ height: 28 }}
              />
              {visit.weather?.temp && (
                <Chip
                  icon={
                    <Box display="flex" alignItems="center">
                      <Thermostat sx={{ fontSize: 18 }} />
                    </Box>
                  }
                  label={`${visit.weather.temp}°C`}
                  size="small"
                  sx={{ height: 28 }}
                />
              )}
            </Box>
          </Box>
        </Box>
        <Collapse in={expanded} timeout="auto">
          <Box mt={2}>
            {groupDetectionsByVideo(visit.detections).map((group, groupIndex) => (
              <Box key={`group-${groupIndex}`}>
                {group.map((detection, index) => (
                  <DetectionItem
                    key={`${detection.video_id}-${index}`}
                    detection={detection}
                    onClick={() => navigate(`/videos/${detection.video_id}`)}
                    isLastInGroup={index === group.length - 1}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};