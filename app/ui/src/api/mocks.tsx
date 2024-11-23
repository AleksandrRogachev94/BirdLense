import { BirdSighting, Video } from '../types';

export const mockBirdSighting: BirdSighting[] = [
  {
    id: '1',
    video_id: 'vid_001',
    start_time: '2024-11-22T11:05:00Z',
    end_time: '2024-11-22T11:07:10Z', // Random duration: 130 seconds
    confidence: 0.85,
    source: 'video',
    weather: {
      temp: 18.3,
      clouds: 10,
    },
    species: {
      id: '1',
      name: 'Cardinal',
    },
    food: {
      id: '1',
      name: 'Sunflower Seeds',
    },
  },
  {
    id: '3',
    video_id: 'vid_003',
    start_time: '2024-11-22T10:10:00Z',
    end_time: '2024-11-22T10:13:40Z', // Random duration: 220 seconds
    confidence: 0.95,
    source: 'video',
    weather: {
      temp: 20.5,
      clouds: 50,
    },
    species: {
      id: '3',
      name: 'Sparrow',
    },
    food: {
      id: '3',
      name: 'Bird Mix',
    },
  },
  {
    id: '2',
    video_id: 'vid_002',
    start_time: '2024-11-22T09:00:00Z',
    end_time: '2024-11-22T09:04:15Z', // Random duration: 255 seconds
    confidence: 0.9,
    source: 'audio',
    weather: {
      temp: 19.0,
      clouds: 25,
    },
    species: {
      id: '2',
      name: 'Blue Jay',
    },
    food: {
      id: '2',
      name: 'Peanuts',
    },
  },
  {
    id: '4',
    video_id: 'vid_004',
    start_time: '2024-11-22T08:15:00Z',
    end_time: '2024-11-22T08:16:40Z', // Random duration: 100 seconds
    confidence: 0.8,
    source: 'audio',
    weather: {
      temp: 17.8,
      clouds: 80,
    },
    species: {
      id: '4',
      name: 'Robin',
    },
    food: {
      id: '4',
      name: 'Worms',
    },
  },
];

export const mockVideo: Video = {
  id: 'abc123',
  processor_version: 'v1.2.3',
  start_time: '2024-11-22T10:00:00Z',
  end_time: '2024-11-22T10:00:46Z',
  video_path: 'https://www.youtube.com/watch?v=H6_YpVBzqNw',
  audio_path: '/audio/abc123.mp3',
  favorite: false,
  weather: {
    main: 'Clear',
    description: 'Clear sky',
    temp: 22.5,
    humidity: 60,
    pressure: 1013,
    clouds: 0,
    wind_speed: 2.5,
  },
  species: [
    {
      species_id: 'sparrow_001',
      species_name: 'House Sparrow',
      start_time: '2024-11-22T10:00:10Z',
      end_time: '2024-11-22T10:00:20Z',
      confidence: 0.98,
      source: 'video',
    },
    {
      species_id: 'robin_002',
      species_name: 'European Robin',
      start_time: '2024-11-22T10:00:30Z',
      end_time: '2024-11-22T10:00:40Z',
      confidence: 0.92,
      source: 'audio',
    },
  ],
  food: [
    {
      id: 'food_001',
      name: 'Sunflower Seeds',
    },
    {
      id: 'food_002',
      name: 'Peanuts',
    },
  ],
};
