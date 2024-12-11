import { Box, Paper, Typography, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface ActivityDay {
  date: string;
  totalUptime: number;
}

interface ActivityLevel {
  threshold: number;
  color: string;
  label: string;
}

const activityLevels: readonly ActivityLevel[] = [
  { threshold: 12, color: '#2e7d32', label: 'Over 12h' },
  { threshold: 8, color: '#43a047', label: '8-12h' },
  { threshold: 4, color: '#ff9800', label: '4-8h' },
  { threshold: 2, color: '#fdd835', label: '2-4h' },
  { threshold: 0.001, color: '#d32f2f', label: 'Under 2h' },
] as const;

const defaultColor = '#f5f5f5';

const getActivityColor = (hours: number): string => {
  const level = activityLevels.find((level) => hours >= level.threshold);
  return level?.color ?? defaultColor;
};

interface ActivityDayProps extends PickersDayProps<Dayjs> {
  activityDays?: ActivityDay[];
}

const ActivityDay = ({ day, activityDays, ...other }: ActivityDayProps) => {
  const formattedDate = day.format('YYYY-MM-DD');
  const dayData = activityDays?.find((d) => d.date === formattedDate);
  const uptimeHours = dayData?.totalUptime ?? 0;
  const bgColor = getActivityColor(uptimeHours);

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        bgcolor: bgColor,
        '&:hover': {
          bgcolor: bgColor,
        },
        '&.Mui-selected': {
          bgcolor: 'gray',
          '&:hover': {
            bgcolor: 'gray',
          },
        },
        color: uptimeHours > 4 ? 'white' : 'black',
      }}
    />
  );
};

const Legend = () => (
  <Stack
    direction="row"
    spacing={2}
    justifyContent="center"
    sx={{ mt: 2, pb: 1 }}
  >
    {activityLevels.map(({ color, label }) => (
      <Stack key={label} direction="row" spacing={1} alignItems="center">
        <Box
          sx={{ width: 12, height: 12, bgcolor: color, borderRadius: 0.5 }}
        />
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    ))}
  </Stack>
);

export const SystemActivity = () => {
  const { data: activityDays } = useQuery({
    queryKey: ['activity', dayjs().format('YYYY-MM')],
    queryFn: async () => {
      const { data } = await axios.get<ActivityDay[]>(
        '/api/ui/system/activity',
        {
          params: { month: dayjs().format('YYYY-MM') },
        },
      );
      return data;
    },
  });

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3 }}>
        System Activity
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <StaticDatePicker
          defaultValue={dayjs()}
          readOnly
          displayStaticWrapperAs="desktop"
          slots={{
            day: (props) => (
              <ActivityDay {...props} activityDays={activityDays} />
            ),
          }}
          slotProps={{
            actionBar: { sx: { display: 'none' } },
            toolbar: { hidden: true },
          }}
        />
      </LocalizationProvider>

      <Legend />
    </>
  );
};
