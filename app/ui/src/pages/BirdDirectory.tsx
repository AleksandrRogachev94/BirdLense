import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBirdDirectory } from '../api/api';
import {
  Box,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { BirdDirectoryTreeView } from '../components/BirdDirectoryTreeView';
import { Species } from '../types';

export const BirdDirectory = () => {
  const [filter, setFilter] = useState<'all' | 'regional'>('regional');

  const {
    data: birds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bird-directory', filter],
    queryFn: () => fetchBirdDirectory(filter),
    enabled: !!filter, // Only run the query if there's a filter selected
  });

  const handleFilterChange = (event: SelectChangeEvent<'all' | 'regional'>) => {
    setFilter(event.target.value as 'all' | 'regional');
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error loading sightings data.</div>;

  return (
    <>
      <Box>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h4" mb={3}>
            Bird Directory
          </Typography>
        </Box>
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
        <FormControl>
          <InputLabel id="filter-label">Filter</InputLabel>
          <Select
            labelId="filter-label"
            value={filter}
            onChange={handleFilterChange}
            label="Filter"
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="regional">Regional</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <BirdDirectoryTreeView birds={birds as Species[]} onSelect={() => {}} />
    </>
  );
};
