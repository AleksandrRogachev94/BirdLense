import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export interface HelpDetail {
  title: string;
  content: string;
}

export interface PageHelpProps {
  title: string;
  description?: string;
  details?: HelpDetail[];
  dialogMaxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const PageHelp = ({
  title,
  description,
  details,
  dialogMaxWidth = 'sm',
}: PageHelpProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const dialogTitleId = `help-dialog-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const dialogDescriptionId = `${dialogTitleId}-description`;

  return (
    <Box component="section" sx={{ mb: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h4">{title}</Typography>
        <Tooltip title="Click for help">
          <IconButton
            onClick={handleOpenDialog}
            size="small"
            aria-label={`Help about ${title}`}
            sx={{ color: 'text.secondary' }}
          >
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        maxWidth={dialogMaxWidth}
        fullWidth
      >
        <DialogTitle id={dialogTitleId}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id={dialogDescriptionId}>
            {description}
          </DialogContentText>
          {details && details.length > 0 && (
            <Box component="dl" sx={{ mt: 2 }}>
              {details.map((detail, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography
                    component="dt"
                    variant="subtitle2"
                    color="primary"
                    gutterBottom
                  >
                    {detail.title}
                  </Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                    {detail.content}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
