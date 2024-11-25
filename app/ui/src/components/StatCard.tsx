import { Box, Card, CardContent, Typography } from '@mui/material';

export const StatCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        <Box display="flex" alignItems="center">
          <Icon fontSize="large" sx={{ mr: 1 }} color="primary" />
          <span>{title}</span>
        </Box>
      </Typography>
      <Typography variant="h5">
        <strong>{value}</strong>
      </Typography>
    </CardContent>
  </Card>
);
