import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
}

export const StatCard = ({ icon: Icon, title, value }: StatCardProps) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={2}>
        <Icon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography color="text.secondary" variant="subtitle2">
            {title}
          </Typography>
          <Typography variant="h5">{value}</Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);
