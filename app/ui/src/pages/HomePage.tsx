import { useState } from 'react';
import { Timeline } from '../components/Timeline';
import { Stats } from '../components/Stats';
import { BirdSighting } from '../types';
import { Box, CircularProgress } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchSightings } from '../api/api';

export function HomePage() {
  const [date, setDate] = useState<Dayjs | null>(dayjs());

  // Use React Query's useQuery hook to fetch data
  const {
    data: sightings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['birdSightings', date],
    queryFn: () => fetchSightings(date),
    enabled: !!date, // Only run the query if a date is selected
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <div>Error loading sightings data.</div>;

  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={date}
            onChange={(newValue) => setDate(newValue)}
          />
        </LocalizationProvider>
      </Box>

      <Stats sightings={sightings as BirdSighting[]} />
      <Timeline sightings={sightings as BirdSighting[]} />
    </>
  );
}
