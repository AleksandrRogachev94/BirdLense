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
import AccessTime from '@mui/icons-material/AccessTime';
import Thermostat from '@mui/icons-material/Thermostat';
import { BirdSighting } from '../../types';
import { useNavigate } from 'react-router-dom';
import { formatConfidence } from '../../util';

export function Timeline({ sightings }: { sightings: BirdSighting[] }) {
  const navigate = useNavigate();
  return (
    <MuiTimeline position="alternate">
      {sightings.map((sighting) => (
        <TimelineItem key={sighting.id}>
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
                          label={formatConfidence(sighting.confidence)}
                          size="small"
                          color="success"
                        />
                        <Chip
                          icon={<AccessTime />}
                          label={`${(new Date(sighting.end_time).getTime() - new Date(sighting.start_time).getTime()) / 1000}s`}
                          size="small"
                        />
                        {sighting.weather?.temp && (
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
