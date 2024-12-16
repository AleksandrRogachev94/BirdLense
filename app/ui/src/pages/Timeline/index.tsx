import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Timeline } from './Timeline';
import { TimelineStats } from './TimelineStats';
import { SpeciesVisit, Species } from '../../types';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeline } from '../../api/api';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { PageHelp } from '../../components/PageHelp';
import { timelineHelpConfig } from '../../page-help-config';

function useSpeciesList(visits: SpeciesVisit[] | undefined) {
  return visits
    ? visits.reduce((acc: Partial<Species>[], visit) => {
        if (
          !acc.some(
            (existingSpecies) => existingSpecies.name === visit.species.name,
          )
        ) {
          acc.push(visit.species);
        }
        return acc;
      }, [])
    : [];
}

function useFilteredVisits(
  visits: SpeciesVisit[] | undefined,
  selectedSpeciesIds: number[],
) {
  return visits?.filter(
    (visit) =>
      selectedSpeciesIds.length === 0 ||
      selectedSpeciesIds.includes(visit.species.id),
  );
}

export function TimelinePage() {
  const [searchParams] = useSearchParams();
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<number[]>([]);
  const [dateTime, setDateTime] = useState<Dayjs | null>(() => {
    const paramDateTime = searchParams.get('date');
    return paramDateTime ? dayjs(paramDateTime) : dayjs();
  });

  const {
    data: visits,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['speciesVisits', dateTime],
    queryFn: () => {
      if (!dateTime) return [];
      const isTimeSelected = dateTime.hour() !== 0 || dateTime.minute() !== 0;
      return fetchTimeline(
        dateTime.startOf(isTimeSelected ? 'hour' : 'date'),
        dateTime.endOf(isTimeSelected ? 'hour' : 'date'),
      );
    },
    enabled: !!dateTime,
  });

  useEffect(() => {
    if (visits) {
      const speciesId = Number(searchParams.get('speciesId'));
      if (speciesId) {
        const childSpeciesIds = [
          ...new Set(
            visits
              .map((visit) => visit.species)
              .filter(
                (species) =>
                  species.id === speciesId || species.parent_id === speciesId,
              )
              .map((species) => species.id),
          ),
        ];
        if (childSpeciesIds.length > 0) {
          setSelectedSpeciesIds(childSpeciesIds);
        }
      }
    }
  }, [searchParams, visits]);

  const speciesList = useSpeciesList(visits);
  const filteredVisits = useFilteredVisits(visits, selectedSpeciesIds);

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
      <PageHelp {...timelineHelpConfig} />
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ '& > :not(style)': { m: 1, mb: 4, width: '25ch' } }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="Select Date & Time"
            value={dateTime}
            onChange={(newValue) => setDateTime(newValue)}
            maxDateTime={dayjs()}
            views={['year', 'month', 'day', 'hours']}
          />
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

      <TimelineStats visits={filteredVisits as SpeciesVisit[]} />
      <Divider sx={{ marginBottom: 4 }} />
      <Timeline visits={filteredVisits as SpeciesVisit[]} />
    </>
  );
}

export default TimelinePage;
