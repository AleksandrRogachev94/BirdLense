import { useState, useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { OverviewTopSpecies } from '../../types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { labelToUniqueHexColor } from '../../util';

interface HourlyActivityChartProps {
  data: OverviewTopSpecies[];
  hourlyTemperature?: (number | null)[];
}

export const HourlyActivityChart: React.FC<HourlyActivityChartProps> = ({
  data,
  hourlyTemperature = [],
}) => {
  const theme = useTheme();
  const [selectedSpecies, setSelectedSpecies] = useState<number | 'all'>('all');
  const [showTemperature, setShowTemperature] = useState(true);

  const offsetInHours = new Date().getTimezoneOffset() / 60;

  // Adjust array indices for local timezone
  const toLocalHour = (hour: number) => (hour + offsetInHours + 24) % 24;

  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const utcHour = Math.floor(toLocalHour(hour));
      if (selectedSpecies === 'all') {
        return data.reduce((sum, s) => sum + (s.detections[utcHour] || 0), 0);
      }
      return (
        data.find((s) => s.id === selectedSpecies)?.detections[utcHour] || 0
      );
    });
  }, [data, selectedSpecies, offsetInHours]);

  const adjustedTemperature = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const utcHour = Math.floor(toLocalHour(hour));
      return hourlyTemperature[utcHour] ?? null;
    });
  }, [hourlyTemperature, offsetInHours]);

  const hasTemperatureData = adjustedTemperature.some((t) => t !== null);
  const showTempLine = showTemperature && hasTemperatureData;

  const hours = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, '0')}:00`,
  );

  const chartColor =
    selectedSpecies === 'all'
      ? theme.palette.primary.main
      : labelToUniqueHexColor(
          data.find((s) => s.id === selectedSpecies)?.name || '',
        );

  const series = [
    {
      data: hourlyData,
      color: chartColor,
      yAxisId: 'detections',
      label: 'Detections',
      valueFormatter: (v: number | null) =>
        v !== null ? `${v} detections` : '',
    },
    ...(showTempLine
      ? [
          {
            data: adjustedTemperature,
            color: theme.palette.warning.main,
            yAxisId: 'temperature',
            label: 'Temperature',
            valueFormatter: (v: number | null) =>
              v !== null ? `${v}°C` : 'N/A',
          },
        ]
      : []),
  ];

  const yAxis = [
    { id: 'detections', scaleType: 'linear' as const },
    ...(showTempLine
      ? [
          {
            id: 'temperature',
            scaleType: 'linear' as const,
            position: 'right' as const,
            tickLabelStyle: { fill: theme.palette.warning.main },
          },
        ]
      : []),
  ];

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={selectedSpecies}
            onChange={(e) =>
              setSelectedSpecies(e.target.value as number | 'all')
            }
            displayEmpty
          >
            <MenuItem value="all">All Species</MenuItem>
            {data.map((species) => (
              <MenuItem key={species.id} value={species.id}>
                {species.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {hasTemperatureData && (
          <FormControlLabel
            control={
              <Switch
                checked={showTemperature}
                onChange={(e) => setShowTemperature(e.target.checked)}
                size="small"
              />
            }
            label="Temperature"
            slotProps={{ typography: { variant: 'body2' } }}
          />
        )}
      </Box>
      <Box sx={{ width: '100%', height: 220 }}>
        <LineChart
          xAxis={[
            {
              data: hours,
              scaleType: 'band',
              tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 10 },
            },
          ]}
          yAxis={yAxis}
          series={series}
          height={220}
          margin={{
            top: 20,
            bottom: 50,
            left: 40,
            right: showTempLine ? 40 : 10,
          }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'top', horizontal: 'right' },
              padding: 0,
              itemMarkWidth: 10,
              itemMarkHeight: 10,
              markGap: 5,
              itemGap: 15,
              labelStyle: { fontSize: 12 },
            },
          }}
        />
      </Box>
    </Box>
  );
};
