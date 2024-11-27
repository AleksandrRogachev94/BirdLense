import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

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
