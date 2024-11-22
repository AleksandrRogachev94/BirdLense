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
} from '@mui/material';
import AccessTime from '@mui/icons-material/AccessTime';
import Thermostat from '@mui/icons-material/Thermostat';
import { BirdSighting } from '../types';

export function Timeline({ sightings }: { sightings: BirdSighting[] }) {
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
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar src={''} sx={{ width: 56, height: 56 }} />
                  <Box>
                    <Typography variant="h6">
                      {sighting.species.name}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
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
                        label={`${(sighting.confidence * 100).toFixed(1)}%`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </MuiTimeline>
  );
}
