import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Search, Info, Heart, Leaf } from 'lucide-react';
import { BirdTaxonomy } from '../../types';

const mockBirds: BirdTaxonomy[] = [
  {
    id: '1',
    commonName: 'Northern Cardinal',
    scientificName: 'Cardinalis cardinalis',
    family: 'Cardinalidae',
    order: 'Passeriformes',
    imageUrl:
      'https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&q=80',
    preferredFood: [
      'Black Oil Sunflower Seeds',
      'Safflower Seeds',
      'Cracked Corn',
    ],
    description:
      'A distinctive, crested red bird with a black face mask and large orange-red conical bill. Females are more brownish but retain the red accents.',
    isCommonVisitor: true,
  },
  {
    id: '2',
    commonName: 'Blue Jay',
    scientificName: 'Cyanocitta cristata',
    family: 'Corvidae',
    order: 'Passeriformes',
    imageUrl:
      'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&q=80',
    preferredFood: ['Peanuts', 'Sunflower Seeds', 'Acorns'],
    description:
      'Large, blue-crested songbird with complex blue, white, and black plumage. Known for their intelligence and varied vocalizations.',
    isCommonVisitor: true,
  },
  {
    id: '3',
    commonName: 'American Goldfinch',
    scientificName: 'Spinus tristis',
    family: 'Fringillidae',
    order: 'Passeriformes',
    imageUrl:
      'https://images.unsplash.com/photo-1552727451-6f5671e14d83?auto=format&fit=crop&q=80',
    preferredFood: ['Nyjer Seeds', 'Sunflower Hearts', 'Thistle'],
    description:
      'Small finch with bright yellow breeding plumage in males. Females and winter birds are more dull olive-brown.',
    isCommonVisitor: true,
  },
];

export function BirdDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  // const [selectedBird, setSelectedBird] = useState<BirdTaxonomy | null>(null);

  const filteredBirds = mockBirds.filter(
    (bird) =>
      bird.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bird.scientificName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bird Directory
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search birds by common or scientific name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className="w-5 h-5 text-gray-500" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredBirds.map((bird) => (
          <Grid item xs={12} sm={6} md={4} key={bird.id}>
            <Card className="h-full flex flex-col">
              <CardMedia
                component="img"
                height="200"
                image={bird.imageUrl}
                alt={bird.commonName}
                className="h-48 object-cover"
              />
              <CardContent className="flex-grow">
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="start"
                >
                  <div>
                    <Typography variant="h6" gutterBottom>
                      {bird.commonName}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      <em>{bird.scientificName}</em>
                    </Typography>
                  </div>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      // onClick={() => setSelectedBird(bird)}
                      className="mt-1"
                    >
                      <Info className="w-5 h-5" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    icon={<Heart className="w-4 h-4" />}
                    label={bird.isCommonVisitor ? 'Common' : 'Rare'}
                    size="small"
                    color={bird.isCommonVisitor ? 'success' : 'default'}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {bird.description}
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {bird.preferredFood.map((food) => (
                    <Chip
                      key={food}
                      icon={<Leaf className="w-4 h-4" />}
                      label={food}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* {selectedBird && (
        <Dialog
          open={Boolean(selectedBird)}
          onClose={() => setSelectedBird(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h5">{selectedBird.commonName}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {selectedBird.scientificName}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <img 
                  src={selectedBird.imageUrl} 
                  alt={selectedBird.commonName}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Taxonomy</Typography>
                <Typography variant="body2" paragraph>
                  <strong>Family:</strong> {selectedBird.family}<br />
                  <strong>Order:</strong> {selectedBird.order}
                </Typography>
                
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography variant="body2" paragraph>
                  {selectedBird.description}
                </Typography>

                <Typography variant="h6" gutterBottom>Preferred Food</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedBird.preferredFood.map((food) => (
                    <Chip
                      key={food}
                      icon={<Leaf className="w-4 h-4" />}
                      label={food}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedBird(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )} */}
    </Container>
  );
}
