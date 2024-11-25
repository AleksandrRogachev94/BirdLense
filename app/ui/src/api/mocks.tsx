import {
  BirdFood,
  BirdSighting,
  OverviewData,
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

export const mockOverviewData: OverviewData = {
  stats: {
    uniqueSpecies: 20,
    totalDetections: 180,
    lastHourDetections: 12,
    videoDetections: 744,
    audioDetections: 1152,
    busiestHour: 5,
  },
  topSpecies: [
    {
      id: 1,
      name: 'Great Kiskadee',
      detections: [
        54, 90, 8, 77, 98, 114, 74, 80, 27, 114, 116, 61, 56, 94, 43, 55, 118,
        9, 37, 81, 75, 54, 37, 89,
      ],
    },
    {
      id: 2,
      name: 'Monk Parakeet',
      detections: [
        31, 0, 62, 20, 9, 50, 90, 61, 96, 95, 3, 44, 77, 17, 85, 41, 67, 61, 43,
        67, 15, 60, 1, 15,
      ],
    },
    {
      id: 3,
      name: 'Ferruginous Owl',
      detections: [
        3, 1, 1, 17, 25, 23, 0, 22, 18, 19, 11, 5, 1, 17, 16, 10, 15, 24, 9, 8,
        9, 7, 16, 13,
      ],
    },
    {
      id: 4,
      name: 'Killdeer',
      detections: [
        12, 34, 56, 23, 45, 12, 34, 56, 23, 45, 12, 34, 56, 23, 45, 12, 34, 56,
        23, 45, 12, 34, 56, 23,
      ],
    },
    {
      id: 5,
      name: 'Social Flycatcher',
      detections: [
        10, 20, 30, 40, 50, 10, 20, 30, 40, 50, 10, 20, 30, 40, 50, 10, 20, 30,
        40, 50, 10, 20, 30, 40,
      ],
    },
    {
      id: 6,
      name: 'American Robin',
      detections: [
        5, 10, 15, 20, 25, 30, 35, 40, 5, 10, 15, 20, 25, 30, 35, 40, 5, 10, 15,
        20, 25, 30, 35, 40,
      ],
    },
    {
      id: 7,
      name: 'Northern Cardinal',
      detections: [
        3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 3, 6, 9, 12, 15, 18, 21, 24, 27,
        30, 3, 6, 9, 12,
      ],
    },
    {
      id: 8,
      name: 'House Sparrow',
      detections: [
        6, 12, 15, 14, 13, 2, 25, 8, 23, 16, 15, 7, 7, 3, 24, 25, 2, 0, 13, 11,
        3, 9, 25, 18,
      ],
    },
    {
      id: 9,
      name: 'Blue Jay',
      detections: [
        19, 3, 7, 12, 15, 8, 6, 14, 11, 9, 5, 13, 2, 10, 4, 16, 1, 17, 18, 20,
        7, 6, 12, 11,
      ],
    },
    {
      id: 10,
      name: 'Bald Eagle',
      detections: [
        1, 3, 5, 7, 9, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 2, 4, 6, 8, 10, 1, 3, 5,
        7,
      ],
    },
  ],
};
