import {
  BirdFood,
  BirdSighting,
  Settings,
  Species,
  Video,
  Weather,
} from '../types';

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
      name: 'Northern Cardinal',
      image_url:
        'https://images.unsplash.com/photo-1623715618305-ceb095873eb1?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
      name: 'House Sparrow',
      image_url:
        'https://images.unsplash.com/photo-1654567835135-2a39ea442e45?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
      image_url:
        'https://images.unsplash.com/photo-1649115727823-5215e906dd57?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
      name: 'European Robin',
      image_url:
        'https://images.unsplash.com/photo-1627141124845-eaad4d550a53?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    food: {
      id: '4',
      name: 'Worms',
    },
  },
];

export const mockWeather: Weather = {
  main: 'Clear',
  description: 'Clear sky',
  temp: 22.5,
  humidity: 60,
  pressure: 1013,
  clouds: 0,
  wind_speed: 2.5,
};

export const mockVideo: Video = {
  id: 'abc123',
  processor_version: 'v1.2.3',
  start_time: '2024-11-22T10:00:00Z',
  end_time: '2024-11-22T10:00:46Z',
  video_path: 'https://www.youtube.com/watch?v=H6_YpVBzqNw',
  audio_path: '/audio/abc123.mp3',
  favorite: false,
  weather: mockWeather,
  species: [
    {
      species_id: 'sparrow_001',
      species_name: 'House Sparrow',
      start_time: '2024-11-22T10:00:10Z',
      end_time: '2024-11-22T10:00:20Z',
      confidence: 0.98,
      source: 'video',
      image_url:
        'https://images.unsplash.com/photo-1654567835135-2a39ea442e45?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      species_id: 'sparrow_001',
      species_name: 'House Sparrow',
      start_time: '2024-11-22T10:00:25Z',
      end_time: '2024-11-22T10:00:35Z',
      confidence: 0.85,
      source: 'audio',
      image_url:
        'https://images.unsplash.com/photo-1654567835135-2a39ea442e45?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      species_id: 'robin_002',
      species_name: 'European Robin',
      start_time: '2024-11-22T10:00:30Z',
      end_time: '2024-11-22T10:00:40Z',
      confidence: 0.92,
      source: 'audio',
      image_url:
        'https://images.unsplash.com/photo-1627141124845-eaad4d550a53?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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

export const mockBirdFood: BirdFood[] = [
  { id: '1', name: 'Sunflower Seeds', active: true },
  { id: '2', name: 'Peanuts', active: true },
  { id: '3', name: 'Suet Cakes', active: false },
  { id: '4', name: 'Nyjer Seeds', active: false },
];

export const mockSetttings: Settings = {
  web: {
    host: '0.0.0.0',
    port: 8080,
  },
  processor: {
    video_width: 1280,
    video_height: 720,
    tracker: 'bytetrack.yaml',
    max_record_seconds: 60,
    max_inactive_seconds: 10,
    save_images: false,
  },
  secrets: {
    openweather_api_key: 'YOUR_API_KEY_HERE',
    latitude: 'YOUR_LATITUDE_HERE',
    longitude: 'YOUR_LONGITUDE_HERE',
  },
};

export const mockBirdDirectory: Species[] = [
  {
    id: 1,
    name: 'Cardinalidae',
    parent_id: null,
    created_at: '2024-11-23T00:00:00Z',
    photo: 'cardinalidae_photo_url',
    description: 'The family of birds that includes cardinals.',
    active: true,
  },
  {
    id: 2,
    name: 'Northern Cardinal',
    parent_id: 1,
    created_at: '2024-11-23T00:00:00Z',
    photo: 'northern_cardinal_photo_url',
    description: 'A species of cardinal found in North and Central America.',
    active: true,
  },
  {
    id: 3,
    name: 'Northern Cardinal (Female)',
    parent_id: 2,
    created_at: '2024-11-23T00:00:00Z',
    photo: 'northern_cardinal_female_photo_url',
    description: 'The female of the Northern Cardinal species.',
    active: true,
  },
  {
    id: 4,
    name: 'Northern Cardinal (Male)',
    parent_id: 2,
    created_at: '2024-11-23T00:00:00Z',
    photo: 'northern_cardinal_male_photo_url',
    description: 'The male of the Northern Cardinal species.',
    active: true,
  },
  {
    id: 5,
    name: 'Blue Jay',
    parent_id: null,
    created_at: '2024-11-23T00:00:00Z',
    photo: 'blue_jay_photo_url',
    description: 'A species of passerine bird in the family Corvidae.',
    active: true,
  },
];
