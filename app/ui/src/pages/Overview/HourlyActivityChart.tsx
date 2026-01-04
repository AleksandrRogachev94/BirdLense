import React, { useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { OverviewTopSpecies } from '../../types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { labelToUniqueHexColor } from '../../util';

interface HourlyActivityChartProps {
  data: OverviewTopSpecies[];
}

export const HourlyActivityChart: React.FC<HourlyActivityChartProps> = ({
  data,
}) => {
  const theme = useTheme();
  const [selectedSpecies, setSelectedSpecies] = useState<number | 'all'>('all');

  const offsetInHours = new Date().getTimezoneOffset() / 60;

  // Get hourly data for selected species or all
  const getHourlyData = (speciesId: number | 'all') => {
    return Array.from({ length: 24 }, (_, hour) => {
      const utcHour = (hour + offsetInHours + 24) % 24;
      if (speciesId === 'all') {
        return data.reduce(
          (sum, species) =>
            sum + (species.detections[Math.floor(utcHour)] || 0),
          0,
        );
      } else {
        const species = data.find((s) => s.id === speciesId);
        return species?.detections[Math.floor(utcHour)] || 0;
      }
    });
  };

  const hourlyData = getHourlyData(selectedSpecies);
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

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <FormControl size="small" sx={{ mb: 1, minWidth: 150 }}>
        <Select
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value as number | 'all')}
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
      <Box sx={{ width: '100%', height: 220 }}>
        <LineChart
          xAxis={[
            {
              data: hours,
              scaleType: 'band',
              tickLabelStyle: {
                angle: 45,
                textAnchor: 'start',
                fontSize: 10,
              },
            },
          ]}
          series={[
            {
              data: hourlyData,
              color: chartColor,
              valueFormatter: (value) => `${value} detections`,
            },
          ]}
          height={220}
          margin={{ top: 10, bottom: 50, left: 40, right: 10 }}
          slotProps={{
            legend: { hidden: true },
          }}
        />
      </Box>
    </Box>
  );
};
