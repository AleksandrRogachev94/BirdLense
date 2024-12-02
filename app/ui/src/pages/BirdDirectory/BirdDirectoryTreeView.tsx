import { useMemo } from 'react';
import { Species } from '../../types';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

interface NestedSpecies extends Species {
  children: NestedSpecies[];
}

// Function to convert flat data to nested structure
const convertToNested = (speciesList: Species[]): NestedSpecies[] => {
  const speciesMap = new Map<number, NestedSpecies>();
  const result: NestedSpecies[] = [];

  speciesList.forEach((species) => {
    speciesMap.set(species.id, { ...species, children: [] });
  });

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

  return result;
};

// const calculateExpandedItems = (selectedItemId: number | null, speciesList: Species[]): number[] => {
//   const expandedItems: number[] = [];
//   let currentItemId = selectedItemId;

//   while (currentItemId !== null) {
//     expandedItems.push(currentItemId);
//     const parent = speciesList.find(species => species.id === currentItemId)?.parent_id;
//     currentItemId = parent ?? null;
//   }

//   return expandedItems.reverse(); // To ensure parents are expanded before their children
// };

export const BirdDirectoryTreeView = ({
  birds,
  onSelect,
}: {
  birds: Species[];
  onSelect: (id: number | null) => void;
}) => {
  const nestedBirdDirectory = useMemo(() => convertToNested(birds), [birds]);

  return (
    <div>
      <RichTreeView
        items={nestedBirdDirectory}
        getItemLabel={(item) => item.name}
        getItemId={(item) => item.id.toString()}
        onSelectedItemsChange={(_, id) => onSelect(id ? +id : null)}
      />
    </div>
  );
};
