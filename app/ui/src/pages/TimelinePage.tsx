import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Timeline } from '../components/Timeline';
import { TimelineStats } from '../components/TimelineStats';
import { BirdSighting, Species } from '../types';
import {
  Box,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeline } from '../api/api';

function useSpeciesList(sightings: BirdSighting[] | undefined) {
  return sightings
    ? sightings.reduce((acc: Partial<Species>[], sighting) => {
        if (
          !acc.some(
            (existingSpecies) => existingSpecies.name === sighting.species.name,
          )
        ) {
          acc.push(sighting.species);
        }
        return acc;
      }, [])
    : [];
}

function useSpeciesIdFromSearchParams(searchParams: URLSearchParams) {
  const [speciesId, setSpeciesId] = useState<string>('all');

  useEffect(() => {
    const paramSpeciesId = searchParams.get('speciesId');
    if (paramSpeciesId) setSpeciesId(paramSpeciesId);
  }, [searchParams]);

  return [speciesId, setSpeciesId] as const;
}

function useFilteredSightings(
  sightings: BirdSighting[] | undefined,
  speciesId: string,
) {
  return sightings?.filter(
    (sighting) => speciesId === 'all' || sighting.species.id === +speciesId,
  );
}

export function TimelinePage() {
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [time, setTime] = useState<Dayjs | null>(dayjs()); // Optional time selection
  const [searchParams, setSearchParams] = useSearchParams();
  const [speciesId, setSpeciesId] = useSpeciesIdFromSearchParams(searchParams);

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

  const {
    data: sightings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['birdSightings', date, time],
    queryFn: () => {
      // When no time is selected, default to the start of the day (00:00)
      const finalDateTime = time
        ? date?.set('hour', time.hour()).set('minute', time.minute())
        : date?.startOf('day');
      return fetchTimeline(
        finalDateTime?.startOf(time ? 'hour' : 'date') || dayjs(),
        finalDateTime?.endOf(time ? 'hour' : 'date') || dayjs(),
      );
    },
    enabled: !!date,
  });

  const speciesList = useSpeciesList(sightings);
  const filteredSightings = useFilteredSightings(sightings, speciesId);

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error loading data.</div>;

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
            onAccept={(newValue) => setDate(newValue)}
            maxDate={dayjs()}
          />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimePicker
              label="Hour"
              value={time}
              onAccept={(newValue) => setTime(newValue)}
              views={['hours']}
              viewRenderers={{ hours: renderTimeViewClock }}
            />
            <IconButton onClick={() => setTime(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
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
