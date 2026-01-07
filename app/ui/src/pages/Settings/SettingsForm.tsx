import { useForm } from '@tanstack/react-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import { Settings, Species } from '../../types';
import { fetchCoordinatesByZip } from '../../api/api';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';

export const SettingsForm = ({
  currentSettings,
  birdFamilies,
  observedSpecies,
  onSubmit,
}: {
  currentSettings: Settings;
  birdFamilies: Partial<Species>[];
  observedSpecies: Species[];
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

  const resolutions = [
    { label: 'FullHD (1920x1080)', width: 1920, height: 1080 },
    { label: 'HD (1280x720)', width: 1280, height: 720 },
    { label: 'VGA (640x480)', width: 640, height: 480 },
  ];

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
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
          <form.Field name="general.enable_notifications">
            {(field) => (
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
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <form.Subscribe
            selector={(state) => [state.values.general.enable_notifications]}
          >
            {([notificationsEnabled]) => (
              <form.Field name="general.notification_excluded_species">
                {(field) => (
                  <FormControl fullWidth disabled={!notificationsEnabled}>
                    <InputLabel>Exclude from Notifications</InputLabel>
                    <Select
                      multiple
                      value={field.state.value || []}
                      onChange={(e) =>
                        field.handleChange(e.target.value as string[])
                      }
                      label="Exclude from Notifications"
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {observedSpecies.map((species) => (
                        <MenuItem key={species.id} value={species.name}>
                          <Checkbox
                            checked={(field.state.value || []).includes(
                              species.name,
                            )}
                          />
                          <ListItemText
                            primary={species.name}
                            secondary={`Detected ${species.count} times`}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select species to ignore when sending notifications
                    </FormHelperText>
                  </FormControl>
                )}
              </form.Field>
            )}
          </form.Subscribe>
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
              <TextField
                fullWidth
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="string"
                onChange={(e) => field.handleChange(e.target.value)}
                label="OpenWeather API Key"
                helperText="Required for fetching weather data"
              />
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
                  helperText="Enter ZIP code to automatically fetch location"
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
        <Grid size={{ xs: 12 }}>
          <form.Field name="processor.video_width">
            {(widthField) => (
              <form.Field name="processor.video_height">
                {(heightField) => {
                  const currentWidth = widthField.state.value;
                  const currentHeight = heightField.state.value;
                  const selectedResolution = resolutions.find(
                    (r) =>
                      r.width === currentWidth && r.height === currentHeight,
                  );

                  return (
                    <FormControl fullWidth>
                      <InputLabel>Video Resolution</InputLabel>
                      <Select
                        value={
                          selectedResolution
                            ? `${selectedResolution.width}x${selectedResolution.height}`
                            : ''
                        }
                        label="Video Resolution"
                        onChange={(e) => {
                          const [w, h] = (e.target.value as string)
                            .split('x')
                            .map(Number);
                          widthField.handleChange(w);
                          heightField.handleChange(h);
                        }}
                      >
                        {resolutions.map((res) => (
                          <MenuItem
                            key={res.label}
                            value={`${res.width}x${res.height}`}
                          >
                            {res.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        Select the resolution for video recording
                      </FormHelperText>
                    </FormControl>
                  );
                }}
              </form.Field>
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
                  helperText="Path to the object tracking configuration file"
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
                  helperText="Maximum duration for a single recording session"
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
                  helperText="Stop recording after this many seconds of no activity"
                />
              </>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <form.Field name="processor.spectrogram_px_per_sec">
            {(field) => (
              <>
                <TextField
                  fullWidth
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="string"
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  label="Spectrogram Horizontal Resolution (px/sec)"
                  helperText="Higher values result in wider spectrogram images"
                />
              </>
            )}
          </form.Field>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <form.Field name="processor.included_bird_families">
            {(field) => (
              <FormControl fullWidth>
                <InputLabel>Included Bird Families</InputLabel>
                <Select
                  multiple
                  value={field.state.value || []}
                  onChange={(e) =>
                    field.handleChange(e.target.value as string[])
                  }
                  label="Included Bird Families"
                  renderValue={(selected) => selected.join(', ')}
                >
                  {birdFamilies.map((family) => (
                    <MenuItem key={family.id} value={family.name}>
                      <Checkbox
                        checked={(field.state.value || []).includes(
                          family.name as string,
                        )}
                      />
                      <ListItemText primary={family.name} />
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Only detect birds from these families
                </FormHelperText>
              </FormControl>
            )}
          </form.Field>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* AI Settings Section */}
      <Typography variant="h5" gutterBottom>
        AI Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <form.Field name="ai.gemini_api_key">
            {(field) => (
              <TextField
                fullWidth
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="password"
                onChange={(e) => field.handleChange(e.target.value)}
                label="Gemini API Key"
                helperText="Enables: Daily AI Summary, LLM verification for bird detection"
              />
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <form.Field name="ai.model">
            {(field) => (
              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select
                  value={field.state.value || 'gemini-3-flash-preview'}
                  label="Model"
                  onChange={(e) => field.handleChange(e.target.value)}
                >
                  <MenuItem value="gemini-3-flash-preview">
                    Gemini 3 Flash (Preview)
                  </MenuItem>
                  <MenuItem value="gemini-2.5-flash-lite">
                    Gemini 2.5 Flash Lite
                  </MenuItem>
                </Select>
                <FormHelperText>
                  Model used for LLM verification and summaries
                </FormHelperText>
              </FormControl>
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <form.Field name="ai.llm_verification.min_confidence">
            {(field) => (
              <TextField
                fullWidth
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 1, step: 0.1 } }}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                label="Min Confidence for LLM Verification"
                helperText="Detections below this confidence will be verified by LLM (0-1)"
              />
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <form.Field name="ai.llm_verification.max_calls_per_hour">
            {(field) => (
              <TextField
                fullWidth
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                label="Max Calls/Hour"
                helperText="Rate limit"
              />
            )}
          </form.Field>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <form.Field name="ai.llm_verification.max_calls_per_day">
            {(field) => (
              <TextField
                fullWidth
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                label="Max Calls/Day"
                helperText="Rate limit"
              />
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
