import { SpeciesVisit } from '../../types';
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
import Divider from '@mui/material/Divider';
import AccessTime from '@mui/icons-material/AccessTime';
import Thermostat from '@mui/icons-material/Thermostat';
import Groups from '@mui/icons-material/Groups';
import VideoCall from '@mui/icons-material/VideoCall';
import Mic from '@mui/icons-material/Mic';
import { useNavigate } from 'react-router-dom';
import { useTheme, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface DetectionItemProps {
  detection: SpeciesVisit['detections'][0];
  showDivider: boolean;
  onClick: () => void;
  theme: Theme;
}

interface TimelineProps {
  visits: SpeciesVisit[];
}

const DetectionItem = ({
  detection,
  showDivider,
  onClick,
  theme,
}: DetectionItemProps) => (
  <Box mb={showDivider ? 1 : 0}>
    <CardActionArea
      onClick={onClick}
      sx={{
        p: 1,
        borderRadius: 1,
        backgroundColor: theme.palette.action.hover,
      }}
    >
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        {detection.source === 'video' ? (
          <VideoCall color="primary" />
        ) : (
          <Mic color="secondary" />
        )}
        <Typography variant="body2" color="text.secondary">
          {new Date(detection.start_time).toLocaleTimeString()}
        </Typography>
        <Chip
          label={`${Math.round(detection.confidence * 100)}%`}
          size="small"
          color={detection.source === 'video' ? 'primary' : 'secondary'}
        />
        <Typography variant="body2" color="text.secondary">
          {Math.round(
            (new Date(detection.end_time).getTime() -
              new Date(detection.start_time).getTime()) /
              1000,
          )}
          s
        </Typography>
      </Box>
    </CardActionArea>
    {showDivider && <Divider sx={{ my: 1 }} />}
  </Box>
);

export const Timeline = ({ visits }: TimelineProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  type Detection = SpeciesVisit['detections'][0];

  const renderDetections = (detections: Detection[]) => {
    const groupedDetections = detections.reduce<Detection[][]>(
      (acc, detection, i) => {
        if (i === 0 || detections[i - 1].video_id !== detection.video_id) {
          acc.push([]);
        }
        acc[acc.length - 1].push(detection);
        return acc;
      },
      [],
    );

    return groupedDetections.map((videoDetections, groupIndex) => (
      <Box key={`group-${groupIndex}`}>
        {videoDetections.map((detection, index) => (
          <DetectionItem
            key={`${detection.video_id}-${index}`}
            detection={detection}
            showDivider={
              groupIndex < groupedDetections.length - 1 &&
              index === videoDetections.length - 1
            }
            onClick={() => navigate(`/videos/${detection.video_id}`)}
            theme={theme}
          />
        ))}
      </Box>
    ));
  };

  return (
    <MuiTimeline position={isMobile ? 'right' : 'alternate'}>
      {visits.map((visit) => (
        <TimelineItem key={visit.id}>
          {!isMobile && (
            <TimelineOppositeContent color="text.secondary">
              {new Date(visit.start_time).toLocaleTimeString()}
            </TimelineOppositeContent>
          )}
          <TimelineSeparator>
            <TimelineDot color="primary" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Avatar
                    src={visit.species.image_url}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Box flex={1} minWidth={200}>
                    <Typography variant="h6" component="div">
                      {visit.species.name}
                    </Typography>
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                      <Chip
                        icon={<Groups />}
                        label={`${visit.max_simultaneous} birds`}
                        size="small"
                      />
                      <Chip
                        icon={<AccessTime />}
                        label={`${Math.round(
                          (new Date(visit.end_time).getTime() -
                            new Date(visit.start_time).getTime()) /
                            1000,
                        )}s`}
                        size="small"
                      />
                      {visit.weather?.temp && (
                        <Chip
                          icon={<Thermostat />}
                          label={`${visit.weather.temp}°C`}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                <Box mt={2}>{renderDetections(visit.detections)}</Box>
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </MuiTimeline>
  );
};
