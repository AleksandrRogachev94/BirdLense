import { useState } from 'react';
import type { SpeciesVisit } from '../../types';
import MuiTimeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
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
import useMediaQuery from '@mui/material/useMediaQuery';

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

export const Timeline = ({ visits }: { visits: SpeciesVisit[] }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expandedVisits, setExpandedVisits] = useState<Record<number, boolean>>(
    {},
  );

  const toggleVisit = (visitId: number) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [visitId]: !prev[visitId],
    }));
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

  return (
    <MuiTimeline
      position={isMobile ? 'right' : 'alternate'}
      sx={{
        p: isMobile ? 1 : 3,
        '& .MuiTimelineItem-root:before': isMobile ? { display: 'none' } : {},
      }}
    >
      {visits.map((visit) => (
        <TimelineItem key={visit.id}>
          {!isMobile && (
            <TimelineOppositeContent sx={{ flex: 0.5, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {new Date(visit.start_time).toLocaleTimeString()}
              </Typography>
            </TimelineOppositeContent>
          )}
          <TimelineSeparator>
            <TimelineDot color="primary" sx={{ my: 1 }} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent sx={{ py: '16px', px: 2 }}>
            <Card>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Avatar
                    src={visit.species.image_url}
                    sx={{
                      width: isMobile ? 44 : 48,
                      height: isMobile ? 44 : 48,
                    }}
                  />
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant={isMobile ? 'body1' : 'h6'}
                        component="div"
                        sx={{
                          flex: 1,
                          lineHeight: isMobile ? 1.4 : 1.5,
                          wordBreak: 'break-word',
                        }}
                      >
                        {visit.species.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => toggleVisit(visit.id)}
                        sx={{ mt: -0.5 }}
                      >
                        {expandedVisits[visit.id] ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )}
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
                <Collapse in={expandedVisits[visit.id]} timeout="auto">
                  <Box mt={2}>
                    {groupDetectionsByVideo(visit.detections).map(
                      (group, groupIndex) => (
                        <Box key={`group-${groupIndex}`}>
                          {group.map((detection, index) => (
                            <DetectionItem
                              key={`${detection.video_id}-${index}`}
                              detection={detection}
                              onClick={() =>
                                navigate(`/videos/${detection.video_id}`)
                              }
                              isLastInGroup={index === group.length - 1}
                            />
                          ))}
                        </Box>
                      ),
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </MuiTimeline>
  );
};
