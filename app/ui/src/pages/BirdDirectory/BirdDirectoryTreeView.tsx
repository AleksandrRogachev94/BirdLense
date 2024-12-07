import { Species } from '../../types';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

export const BirdDirectoryTreeView = ({
  birds,
  onSelect,
}: {
  birds: Species[];
  onSelect: (id: number | null) => void;
}) => {
  return (
    <div>
      <RichTreeView
        items={birds}
        getItemLabel={(item) => `${item.name} (${item.count})`}
        getItemId={(item) => item.id.toString()}
        onSelectedItemsChange={(_, id) => onSelect(id ? +id : null)}
      />
    </div>
  );
};
