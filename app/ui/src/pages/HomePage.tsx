import React, { useEffect, useState } from 'react';
import { Timeline } from '../components/Timeline';
import { Stats } from '../components/Stats';
import { BirdSighting } from '../types';
import { Container } from '@mui/material';

// Mock data - replace with actual API call
const mockData: BirdSighting[] = [
  {
    id: '1',
    species: 'Northern Cardinal',
    timestamp: '2024-03-10T08:30:00Z',
    duration: 45,
    imageUrl:
      'https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&q=80',
    confidence: 0.95,
    feedAmount: 3,
  },
  {
    id: '2',
    species: 'Blue Jay',
    timestamp: '2024-03-10T09:15:00Z',
    duration: 30,
    imageUrl:
      'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&q=80',
    confidence: 0.88,
    feedAmount: 4,
  },
  {
    id: '3',
    species: 'American Goldfinch',
    timestamp: '2024-03-09T14:20:00Z',
    duration: 60,
    imageUrl:
      'https://images.unsplash.com/photo-1552727451-6f5671e14d83?auto=format&fit=crop&q=80',
    confidence: 0.92,
    feedAmount: 2,
  },
];

export function HomePage() {
  const [sightings, setSightings] = useState<BirdSighting[]>([]);

  useEffect(() => {
    // Replace with actual API call
    setSightings(mockData);
  }, []);

  return (
    <Container>
      <Stats sightings={sightings} />
      <Timeline sightings={sightings} />
    </Container>
  );
}
