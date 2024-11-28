import { useForm } from '@tanstack/react-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Settings } from '../types';
import { fetchCoordinatesByZip } from '../api/api';
import FormControlLabel from '@mui/material/FormControlLabel';

export const SettingsForm = ({
  currentSettings,
  onSubmit,
}: {
  currentSettings: Settings;
  onSubmit: (settings: Settings) => void;
}) => {
  const form = useForm<Settings>({
    defaultValues: currentSettings,
    onSubmit: ({ value }) => onSubmit(value),
  });

  const handleZipLookup = async () => {
    const zip = form.getFieldValue('secrets.zip');
    if (!zip) return;
    try {
      const { lat, lon } = await fetchCoordinatesByZip(zip);
      form.setFieldValue('secrets.latitude', lat);
      form.setFieldValue('secrets.longitude', lon);
    } catch (error) {
      console.log(error);
      alert('Failed to fetch coordinates. Please check the ZIP code.');
    }
  };

  return (
    <Box
      component="form"
      // sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
      noValidate
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* Secrets Section */}
      <Typography variant="h5" gutterBottom>
        General
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <form.Field name="general.enable_notifications">
            {(field) => (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      id={field.name}
                      name={field.name}
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                    />
                  }
                  label="Enable Notifications"
                />
              </>
            )}
          </form.Field>
        </Grid>
      </Grid>
      <Divider sx={{ my: 4 }} />
      {/* Secrets Section */}
      <Typography variant="h5" gutterBottom>
        Secrets
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <form.Field name="secrets.openweather_api_key">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(e.target.value)}
                  label="OpenWeather API Key"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="secrets.zip">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(e.target.value)}
                  label="ZIP Code"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            sx={{ height: '100%' }}
            variant="outlined"
            color="secondary"
            onClick={handleZipLookup}
          >
            Convert ZIP to Lat/Lon
          </Button>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="secrets.latitude">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(e.target.value)}
                  label="Latitude"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="secrets.longitude">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(e.target.value)}
                  label="Longitude"
                />
              </>
            )}
          </form.Field>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Processor Settings */}
      <Typography variant="h5" gutterBottom>
        Processor Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <form.Field name="processor.video_width">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  label="Video Width"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="processor.video_height">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  label="Video Height"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="processor.tracker">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(e.target.value)}
                  label="Object Tracker"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="processor.max_record_seconds">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  label="Max Record Seconds"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="processor.max_inactive_seconds">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  label="Max Inactive Seconds"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="processor.save_images">
            {(field) => (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      id={field.name}
                      name={field.name}
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                    />
                  }
                  label="Save Images (test mode)"
                />
              </>
            )}
          </form.Field>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Button variant="contained" fullWidth type="submit">
        Save Settings
      </Button>
    </Box>
  );
};
