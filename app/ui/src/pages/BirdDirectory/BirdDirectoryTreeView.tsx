import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link } from 'react-router-dom';

interface NestedSpecies {
  id: number;
  name: string;
  active: boolean;
  count?: number;
  children: NestedSpecies[];
}

interface BirdDirectoryTreeViewProps {
  birds: NestedSpecies[];
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  searchQuery?: string;
}

const TreeItem = ({
  node,
  parentActive = false,
  expandedIds,
  onToggleExpand,
  searchQuery = '',
}: {
  node: NestedSpecies;
  parentActive?: boolean;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  searchQuery?: string;
}) => {
  const hasChildren = node.children.length > 0;
  // Clickable if: active, has active parent, or is a leaf with observations
  const isLeafWithObservations = !hasChildren && (node.count || 0) > 0;
  const isClickable = node.active || parentActive || isLeafWithObservations;
  const expanded = expandedIds.has(node.id);

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;
    const index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <Box
          component="span"
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 0.5,
            px: 0.25,
          }}
        >
          {text.slice(index, index + searchQuery.length)}
        </Box>
        {text.slice(index + searchQuery.length)}
      </>
    );
  };

  return (
    <li>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0.75,
          borderRadius: 1,
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        }}
      >
        {hasChildren && (
          <IconButton
            size="small"
            onClick={() => onToggleExpand(node.id)}
            sx={{ mr: 1 }}
          >
            {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
        {!hasChildren && <Box sx={{ width: 40 }} />}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            color: isClickable ? 'primary.main' : 'text.primary',
          }}
        >
          {isClickable ? (
            <Link
              to={`/species/${node.id}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <Typography variant="body2">
                {highlightMatch(node.name)}
              </Typography>
              <OpenInNewIcon sx={{ ml: 1, fontSize: 16 }} />
            </Link>
          ) : (
            <Typography variant="body2">{highlightMatch(node.name)}</Typography>
          )}
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            minWidth: '2rem',
            textAlign: 'right',
            pr: 1,
          }}
        >
          {node.count || 0}
        </Typography>
      </Box>

      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              parentActive={node.active || parentActive}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              searchQuery={searchQuery}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const BirdDirectoryTreeView = ({
  birds,
  expandedIds,
  onToggleExpand,
  searchQuery,
}: BirdDirectoryTreeViewProps) => {
  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: 0,
        '& ul': {
          listStyle: 'none',
          padding: 0,
          margin: 0,
        },
        '& ul ul': {
          paddingLeft: '24px',
        },
      }}
    >
      <ul>
        {birds.map((bird) => (
          <TreeItem
            key={bird.id}
            node={bird}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            searchQuery={searchQuery}
          />
        ))}
      </ul>
    </Box>
  );
};
