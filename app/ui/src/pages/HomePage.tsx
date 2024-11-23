import { useState } from 'react';
import { Timeline } from '../components/Timeline';
import { Stats } from '../components/Stats';
import { BirdSighting, Weather } from '../types';
import { Box, CircularProgress, Divider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchSightings, fetchWeather } from '../api/api';

export function HomePage() {
  const [date, setDate] = useState<Dayjs | null>(dayjs());

  // Fetch bird sightings
  const {
    data: sightings,
    isLoading: isLoadingSightings,
    error: errorSightings,
  } = useQuery({
    queryKey: ['birdSightings', date],
    queryFn: () => fetchSightings(date),
    enabled: !!date, // Only fetch sightings if a date is selected
  });

  // Fetch weather data
  const {
    data: weather,
    isLoading: isLoadingWeather,
    error: errorWeather,
  } = useQuery({
    queryKey: ['weather', date],
    queryFn: () => fetchWeather(),
    enabled: !!date, // Only fetch weather if a date is selected
  });

  if (isLoadingSightings || isLoadingWeather)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (errorSightings || errorWeather) return <div>Error loading data.</div>;

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

      <Stats
        sightings={sightings as BirdSighting[]}
        weather={weather as Weather}
      />
      <Divider sx={{ marginBottom: 4 }} />
      <Timeline sightings={sightings as BirdSighting[]} />
    </>
  );
}
