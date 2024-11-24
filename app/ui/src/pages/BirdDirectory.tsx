import { useQuery } from '@tanstack/react-query';
import { fetchBirdDirectory } from '../api/api';
import { Box, CircularProgress } from '@mui/material';
import { BirdDirectoryTreeView } from '../components/BirdDirectoryTreeView';
import { Species } from '../types';

export const BirdDirectory = () => {
  const {
    data: birds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bird-directory', 'active'],
    queryFn: () => fetchBirdDirectory(true),
  });

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error loading sightings data.</div>;

  return (
    <>
      <BirdDirectoryTreeView birds={birds as Species[]} onSelect={() => {}} />
    </>
  );
};
