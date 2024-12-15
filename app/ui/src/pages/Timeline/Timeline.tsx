import type { SpeciesVisit } from '../../types';
import MuiTimeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { VisitCard } from '../../components/VisitCard';

export const Timeline = ({ visits }: { visits: SpeciesVisit[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <MuiTimeline
      position={isMobile ? 'right' : 'alternate'}
      sx={{
        p: isMobile ? 1 : 3,
        '& .MuiTimelineItem-root:before': isMobile ? { display: 'none' } : {},
      }}
    >
      {visits.map((visit, index) => (
        <TimelineItem key={visit.id}>
          {!isMobile && (
            <TimelineOppositeContent
              sx={{
                m: 'auto 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start',
              }}
              variant="body2"
              color="text.secondary"
            >
              <Typography variant="body2">
                {new Date(visit.start_time).toLocaleTimeString()}
              </Typography>
            </TimelineOppositeContent>
          )}

          <TimelineSeparator>
            <TimelineConnector />
            <TimelineDot
              color="primary"
              sx={{
                my: 0.5,
                borderWidth: 2,
              }}
            />
            <TimelineConnector />
          </TimelineSeparator>

          <TimelineContent>
            <VisitCard
              visit={visit}
              compact={isMobile}
              showDateTime={isMobile}
            />
          </TimelineContent>
        </TimelineItem>
      ))}
    </MuiTimeline>
  );
};
