import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBirdDirectory } from '../../api/api';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { SelectChangeEvent } from '@mui/material/Select';
import { BirdDirectoryTreeView } from './BirdDirectoryTreeView';
import { Species } from '../../types';
import { PageHelp } from '../../components/PageHelp';
import { birdDirHelpConfig } from '../../page-help-config';

type FilterType = 'all' | 'regional' | 'observed';

interface NestedSpecies extends Species {
  children: NestedSpecies[];
}

const convertToNested = (speciesList: Species[]): NestedSpecies[] => {
  const speciesMap = new Map<number, NestedSpecies>();

  // First pass: Create all nodes with initial counts
  speciesList.forEach((species) => {
    speciesMap.set(species.id, {
      ...species,
      children: [],
      count: species.count || 0, // Initialize with species count or 0
    });
  });

  // Second pass: Build tree structure
  const result: NestedSpecies[] = [];
  speciesList.forEach((species) => {
    if (species.parent_id === null) {
      result.push(speciesMap.get(species.id)!);
    } else {
      const parent = speciesMap.get(species.parent_id);
      if (parent) {
        parent.children.push(speciesMap.get(species.id)!);
      }
    }
  });

  // Helper function to calculate total count for a node and its descendants
  const calculateTotalCount = (node: NestedSpecies): number => {
    const childrenCount = node.children.reduce((sum, child) => {
      return sum + calculateTotalCount(child);
    }, 0);
    node.count = (node.count || 0) + childrenCount;
    return node.count;
  };

  // Calculate counts starting from root nodes
  result.forEach(calculateTotalCount);

  return result;
};

const filterNestedSpecies = (
  species: NestedSpecies[],
  filter: FilterType,
  hasActiveParent: boolean = false,
): NestedSpecies[] => {
  return species
    .map((species) => ({
      ...species,
      children: filterNestedSpecies(
        species.children,
        filter,
        species.active || hasActiveParent,
      ),
    }))
    .filter((species) => {
      switch (filter) {
        case 'regional':
          return (
            hasActiveParent || species.active || species.children.length > 0
          );
        case 'observed':
          return (species.count || 0) > 0 || species.children.length > 0;
        default:
          return true;
      }
    });
};

export const BirdDirectory = () => {
  const [filter, setFilter] = useState<FilterType>('observed');

  const { data, isLoading, error } = useQuery({
    queryKey: ['bird-directory'],
    queryFn: () => fetchBirdDirectory(),
    select: (data) => {
      // First convert to nested structure
      const nestedSpecies = convertToNested(data);
      // Then filter the tree while preserving hierarchy
      return filterNestedSpecies(nestedSpecies, filter);
    },
  });

  const handleFilterChange = (event: SelectChangeEvent<FilterType>) => {
    setFilter(event.target.value as FilterType);
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error loading bird directory data.</div>;

  return (
    <>
      <PageHelp {...birdDirHelpConfig} />
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
            <MenuItem value="all">All Species</MenuItem>
            <MenuItem value="regional">Regional</MenuItem>
            <MenuItem value="observed">Observed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <BirdDirectoryTreeView birds={data || []} onSelect={() => {}} />
    </>
  );
};
