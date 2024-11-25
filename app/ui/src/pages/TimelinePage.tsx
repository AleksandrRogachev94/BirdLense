import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Timeline } from '../components/Timeline';
import { TimelineStats } from '../components/TimelineStats';
import { BirdSighting } from '../types';
import {
  Box,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchSightings } from '../api/api';

export function TimelinePage() {
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [speciesId, setSpeciesId] = useState<string>('all');
  const [searchParams, setSearchParams] = useSearchParams();

  // Update speciesId from query params
  useEffect(() => {
    const paramSpeciesId = searchParams.get('speciesId');
    if (paramSpeciesId) setSpeciesId(paramSpeciesId);
  }, [searchParams]);

  // Update query param when speciesId changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (speciesId === 'all') {
      params.delete('speciesId');
    } else {
      params.set('speciesId', speciesId);
    }
    setSearchParams(params);
  }, [speciesId, setSearchParams]);

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

  // Get species list from sightings
  const speciesList = sightings
    ? Array.from(
        new Set(sightings.map((sighting: BirdSighting) => sighting.species)),
      )
    : [];

  // Filter sightings by speciesId
  const filteredSightings = sightings?.filter((sighting: BirdSighting) =>
    speciesId === 'all' ? true : sighting.species.id === speciesId,
  );

  if (isLoadingSightings)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (errorSightings) return <div>Error loading data.</div>;

  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ '& > :not(style)': { m: 1, mb: 4, width: '25ch' } }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={date}
            onChange={(newValue) => setDate(newValue)}
          />
        </LocalizationProvider>
        <FormControl>
          <InputLabel id="species-select-label">Species</InputLabel>
          <Select
            labelId="species-select-label"
            value={speciesId}
            onChange={(e) => setSpeciesId(e.target.value)}
            label="Species"
          >
            <MenuItem value="all">All</MenuItem>
            {speciesList.map((species) => (
              <MenuItem key={species.id} value={species.id}>
                {species.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TimelineStats sightings={filteredSightings as BirdSighting[]} />
      <Divider sx={{ marginBottom: 4 }} />
      <Timeline sightings={filteredSightings as BirdSighting[]} />
    </>
  );
}
