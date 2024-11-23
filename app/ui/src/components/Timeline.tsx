import {
  Timeline as MuiTimeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Box,
  CardActionArea,
} from '@mui/material';
import AccessTime from '@mui/icons-material/AccessTime';
import Thermostat from '@mui/icons-material/Thermostat';
import { BirdSighting } from '../types';
import { useNavigate } from 'react-router-dom';

export function Timeline({ sightings }: { sightings: BirdSighting[] }) {
  const navigate = useNavigate();
  return (
    <MuiTimeline position="alternate">
      {sightings.map((sighting) => (
        <TimelineItem key={sighting.video_id}>
          <TimelineOppositeContent color="text.secondary">
            {new Date(sighting.start_time).toLocaleTimeString()}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="primary" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Card>
              <CardActionArea
                onClick={() => navigate(`/videos/${sighting.video_id}`)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      src={sighting.species.image_url}
                      sx={{ width: 56, height: 56 }}
                    />
                    <Box>
                      <Typography variant="h6">
                        {sighting.species.name}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip
                          label={`${(sighting.confidence * 100).toFixed(1)}%`}
                          size="small"
                          color="success"
                        />
                        <Chip
                          icon={<AccessTime />}
                          label={`${(new Date(sighting.end_time).getTime() - new Date(sighting.start_time).getTime()) / 1000}s`}
                          size="small"
                        />
                        {sighting.weather && (
                          <Chip
                            icon={<Thermostat />}
                            label={`${sighting.weather.temp}°C`}
                            size="small"
                          />
                        )}
                        <Chip
                          label={`${sighting.source}`}
                          size="small"
                          color={
                            sighting.source === 'video'
                              ? 'primary'
                              : 'secondary'
                          }
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </MuiTimeline>
  );
}
