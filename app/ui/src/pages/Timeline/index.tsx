import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Timeline } from './Timeline';
import { TimelineStats } from './TimelineStats';
import { BirdSighting, Species } from '../../types';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeline } from '../../api/api';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

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

function useFilteredSightings(
  sightings: BirdSighting[] | undefined,
  selectedSpeciesIds: number[],
) {
  return sightings?.filter(
    (sighting) =>
      selectedSpeciesIds.length === 0 ||
      selectedSpeciesIds.includes(sighting.species.id),
  );
}

export function TimelinePage() {
  const [searchParams] = useSearchParams();
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<number[]>([]);
  const [date, setDate] = useState<Dayjs | null>(() => {
    const paramDateTime = searchParams.get('date');
    return paramDateTime ? dayjs(paramDateTime) : dayjs();
  });
  const [time, setTime] = useState<Dayjs | null>(() => {
    const paramDateTime = searchParams.get('date');
    return paramDateTime ? dayjs(paramDateTime) : dayjs();
  });

  const {
    data: sightings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['birdSightings', date, time],
    queryFn: () => {
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

  // Set initial species selection based on URL param
  useEffect(() => {
    if (sightings) {
      const speciesId = searchParams.get('speciesId');
      if (speciesId) {
        // Find all species in the sightings that have the speciesId as their parent_id
        const childSpeciesIds = [
          ...new Set(
            sightings
              .map((sighting) => sighting.species)
              .filter((species) => species.parent_id === Number(speciesId))
              .map((species) => Number(species.id)),
          ),
        ];

        // If we found any children, select them all
        if (childSpeciesIds.length > 0) {
          setSelectedSpeciesIds(childSpeciesIds);
        }
      }
    }
  }, [searchParams, sightings]);

  const speciesList = useSpeciesList(sightings);
  const filteredSightings = useFilteredSightings(sightings, selectedSpeciesIds);

  const handleSpeciesChange = (event: { target: { value: any } }) => {
    const value = event.target.value;
    setSelectedSpeciesIds(
      typeof value === 'string'
        ? value.split(',').map(Number)
        : value.map(Number),
    );
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error loading data.</div>;

  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center">
        <Typography variant="h4" mb={3}>
          Timeline
        </Typography>
      </Box>
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
            multiple
            value={selectedSpeciesIds}
            onChange={handleSpeciesChange}
            input={<OutlinedInput label="Species" />}
            renderValue={(selected) =>
              selected.length === 0
                ? 'All'
                : speciesList
                    .filter((species) => selected.includes(Number(species.id)))
                    .map((species) => species.name)
                    .join(', ')
            }
          >
            {speciesList.map((species) => (
              <MenuItem key={species.id} value={Number(species.id)}>
                <Checkbox
                  checked={selectedSpeciesIds.includes(Number(species.id))}
                />
                <ListItemText primary={species.name} />
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

export default TimelinePage;
