import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { OverviewTopSpecies } from '../../types';
import { labelToUniqueHexColor } from '../../util';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface SpeciesDistributionChartProps {
  data: OverviewTopSpecies[];
}

export const SpeciesDistributionChart: React.FC<
  SpeciesDistributionChartProps
> = ({ data }) => {
  const pieData = data
    .map((species) => ({
      id: species.id,
      value: species.detections.reduce((a, b) => a + b, 0),
      label: species.name,
      color: labelToUniqueHexColor(species.name),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (pieData.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <PieChart
        series={[
          {
            data: pieData,
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
            innerRadius: 50,
            outerRadius: 150,
            paddingAngle: 2,
            cornerRadius: 4,
          },
        ]}
        width={400}
        height={400}
        slotProps={{
          legend: {
            hidden: true,
          },
        }}
        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
      />
    </Box>
  );
};
