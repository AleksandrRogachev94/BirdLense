import React from 'react';
import { Timeline as MuiTimeline, TimelineItem, TimelineSeparator, TimelineConnector, 
  TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { Card, CardContent, Typography, Avatar, Chip, Box } from '@mui/material';
import { Clock, Leaf } from 'lucide-react';
import { BirdSighting } from '../types';

interface TimelineProps {
  sightings: BirdSighting[];
}

export function Timeline({ sightings }: TimelineProps) {
  return (
    <MuiTimeline position="alternate">
      {sightings.map((sighting) => (
        <TimelineItem key={sighting.id}>
          <TimelineOppositeContent color="text.secondary">
            {new Date(sighting.timestamp).toLocaleTimeString()}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="primary" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={sighting.imageUrl}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Box>
                    <Typography variant="h6">{sighting.species}</Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip
                        icon={<Clock className="w-4 h-4" />}
                        label={`${sighting.duration}s`}
                        size="small"
                      />
                      {sighting.feedAmount && (
                        <Chip
                          icon={<Leaf className="w-4 h-4" />}
                          label={`${sighting.feedAmount}g`}
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