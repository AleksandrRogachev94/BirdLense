import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface NestedSpecies {
  id: number;
  name: string;
  active: boolean;
  count?: number;
  children: NestedSpecies[];
}

interface BirdDirectoryTreeViewProps {
  birds: NestedSpecies[];
  onSelect: (id: number) => void;
}

const TreeItem = ({
  node,
  parentActive = false,
}: {
  node: NestedSpecies;
  parentActive?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const isClickable = node.active || parentActive;

  return (
    <li>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0.5,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        {hasChildren && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
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
              <Typography variant="body2">{node.name}</Typography>
              <OpenInNewIcon sx={{ ml: 1, fontSize: 16 }} />
            </Link>
          ) : (
            <Typography variant="body2">{node.name}</Typography>
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
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const BirdDirectoryTreeView = ({
  birds,
}: BirdDirectoryTreeViewProps) => {
  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: '0 auto',
        '& ul': {
          listStyle: 'none',
          padding: '0 0 0 24px',
          margin: 0,
        },
      }}
    >
      <ul>
        {birds.map((bird) => (
          <TreeItem key={bird.id} node={bird} />
        ))}
      </ul>
    </Box>
  );
};
