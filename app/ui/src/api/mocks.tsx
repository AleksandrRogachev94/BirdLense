import {
  BirdFood,
  SpeciesVisit,
  OverviewData,
  Settings,
  Species,
  SpeciesSummary,
  Video,
  Weather,
} from '../types';

export const mockTimeline: SpeciesVisit[] = [
  {
    detections: [
      {
        confidence: 1,
        end_time: '2024-12-10T22:21:39.032583+00:00',
        source: 'video',
        start_time: '2024-12-10T22:21:39.032583+00:00',
        video_id: 9,
      },
      {
        confidence: 0.880770206451416,
        end_time: '2024-12-10T22:21:27.395195+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:21:24.395195+00:00',
        video_id: 8,
      },
      {
        confidence: 0.9271260499954224,
        end_time: '2024-12-10T22:21:18.395195+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:21:15.395195+00:00',
        video_id: 8,
      },
      {
        confidence: 1,
        end_time: '2024-12-10T22:21:26.395195+00:00',
        source: 'video',
        start_time: '2024-12-10T22:21:10.395195+00:00',
        video_id: 8,
      },
      {
        confidence: 0.9794095158576965,
        end_time: '2024-12-10T22:21:12.395195+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:21:06.395195+00:00',
        video_id: 8,
      },
      {
        confidence: 0.9253225922584534,
        end_time: '2024-12-10T22:20:55.531709+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:20:52.531709+00:00',
        video_id: 7,
      },
      {
        confidence: 1,
        end_time: '2024-12-10T22:20:56.531709+00:00',
        source: 'video',
        start_time: '2024-12-10T22:20:44.531709+00:00',
        video_id: 7,
      },
      {
        confidence: 0.9835028052330017,
        end_time: '2024-12-10T22:20:46.531709+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:20:40.531709+00:00',
        video_id: 7,
      },
    ],
    end_time: '2024-12-10T22:21:39.032583+00:00',
    id: 5,
    max_simultaneous: 1,
    species: {
      id: 648,
      image_url:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Male_northern_cardinal_in_Central_Park_%2852612%29.jpg/300px-Male_northern_cardinal_in_Central_Park_%2852612%29.jpg',
      name: 'Northern Cardinal (Adult Male)',
      parent_id: 647,
    },
    start_time: '2024-12-10T22:20:44.531709+00:00',
    weather: {
      clouds: 100,
      temp: 10.47,
    },
  },
  {
    detections: [
      {
        confidence: 0.9436666965484619,
        end_time: '2024-12-10T22:02:29.428220+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:02:26.428220+00:00',
        video_id: 6,
      },
      {
        confidence: 0.8,
        end_time: '2024-12-10T22:02:29.428220+00:00',
        source: 'video',
        start_time: '2024-12-10T22:02:19.428220+00:00',
        video_id: 6,
      },
      {
        confidence: 0.9004615545272827,
        end_time: '2024-12-10T22:02:20.428220+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:02:17.428220+00:00',
        video_id: 6,
      },
      {
        confidence: 0.8789811730384827,
        end_time: '2024-12-10T22:02:00.180914+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:01:57.180914+00:00',
        video_id: 5,
      },
      {
        confidence: 0.9217528104782104,
        end_time: '2024-12-10T22:01:51.180914+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:01:45.180914+00:00',
        video_id: 5,
      },
      {
        confidence: 1,
        end_time: '2024-12-10T22:01:59.180914+00:00',
        source: 'video',
        start_time: '2024-12-10T22:01:44.180914+00:00',
        video_id: 5,
      },
      {
        confidence: 0.5056995153427124,
        end_time: '2024-12-10T22:01:42.180914+00:00',
        source: 'audio',
        start_time: '2024-12-10T22:01:39.180914+00:00',
        video_id: 5,
      },
    ],
    end_time: '2024-12-10T22:02:29.428220+00:00',
    id: 4,
    max_simultaneous: 2,
    species: {
      id: 648,
      image_url:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Male_northern_cardinal_in_Central_Park_%2852612%29.jpg/300px-Male_northern_cardinal_in_Central_Park_%2852612%29.jpg',
      name: 'Northern Cardinal (Adult Male)',
      parent_id: 647,
    },
    start_time: '2024-12-10T22:01:44.180914+00:00',
    weather: {
      clouds: 100,
      temp: 10.38,
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
  end_time: '2024-11-22T10:00:13Z',
  video_path: 'https://www.youtube.com/watch?v=H6_YpVBzqNw',
  spectrogram_path:
    'https://www.izotope.com/storage-cms/images/6/3/9/9/259936-1-eng-GB/5b817a665294-Dialogue-shown-in-a-spectrogram.png',
  favorite: false,
  weather: mockWeather,
  species: [
    {
      species_id: 1,
      species_name: 'House Sparrow',
      start_time: 1,
      end_time: 5,
      confidence: 0.98,
      source: 'video',
      image_url:
        'https://images.unsplash.com/photo-1654567835135-2a39ea442e45?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      species_id: 1,
      species_name: 'House Sparrow',
      start_time: 3,
      end_time: 6,
      confidence: 0.85,
      source: 'audio',
      image_url:
        'https://images.unsplash.com/photo-1654567835135-2a39ea442e45?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      species_id: 2,
      species_name: 'European Robin',
      start_time: 7,
      end_time: 9,
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
  { id: 1, name: 'Sunflower Seeds', active: true },
  { id: 2, name: 'Peanuts', active: true },
  { id: 3, name: 'Suet Cakes', active: false },
  { id: 4, name: 'Nyjer Seeds', active: false },
];

export const mockSetttings: Settings = {
  general: {
    enable_notifications: true,
    notification_excluded_species: [],
  },
  processor: {
    video_width: 1280,
    video_height: 720,
    tracker: 'bytetrack.yaml',
    max_record_seconds: 60,
    max_inactive_seconds: 10,
    spectrogram_px_per_sec: 200,
    included_bird_families: ['Squirrel'],
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
    name: 'Birds',
    parent_id: null,
    created_at: '2024-11-23T00:00:00Z',
    image_url: 'cardinalidae_photo_url',
    description: 'The family of birds that includes cardinals.',
    active: true,
    count: 0,
  },
  {
    id: 2,
    name: 'Cardinalidae',
    parent_id: 1,
    created_at: '2024-11-23T00:00:00Z',
    image_url: 'cardinalidae_photo_url',
    description: 'The family of birds that includes cardinals.',
    active: true,
    count: 0,
  },
  {
    id: 3,
    name: 'Northern Cardinal',
    parent_id: 2,
    created_at: '2024-11-23T00:00:00Z',
    image_url: 'northern_cardinal_photo_url',
    description: 'A species of cardinal found in North and Central America.',
    active: true,
    count: 5,
  },
  {
    id: 4,
    name: 'Northern Cardinal (Female)',
    parent_id: 3,
    created_at: '2024-11-23T00:00:00Z',
    image_url: 'northern_cardinal_female_photo_url',
    description: 'The female of the Northern Cardinal species.',
    active: true,
    count: 13,
  },
  {
    id: 5,
    name: 'Northern Cardinal (Male)',
    parent_id: 3,
    created_at: '2024-11-23T00:00:00Z',
    image_url: 'northern_cardinal_male_photo_url',
    description: 'The male of the Northern Cardinal species.',
    active: true,
    count: 14,
  },
  {
    id: 6,
    name: 'Blue Jay',
    parent_id: 1,
    created_at: '2024-11-23T00:00:00Z',
    image_url: 'blue_jay_photo_url',
    description: 'A species of passerine bird in the family Corvidae.',
    active: true,
    count: 50,
  },
];

export const mockOverviewData: OverviewData = {
  stats: {
    uniqueSpecies: 20,
    totalDetections: 180,
    lastHourDetections: 12,
    audioDuration: 744,
    videoDuration: 1152,
    busiestHour: 5,
    avgVisitDuration: 113,
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

export const mockSpeciesSummary: SpeciesSummary = {
  species: {
    description: null,
    id: 719,
    image_url: null,
    name: 'House Finch',
    active: true,
  },
  recentVisits: [],
  stats: {
    detections: {
      detections_24h: 0,
      detections_30d: 4,
      detections_7d: 4,
    },
    food: [],
    hourlyActivity: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0,
    ],
    timeRange: {
      first_sighting: '2024-12-05T20:05:19.945915',
      last_sighting: '2024-12-05T20:25:22.879572',
    },
    weather: [
      {
        clouds: 100,
        count: 4,
        temp: 2,
      },
    ],
  },
  subspecies: [
    {
      species: {
        id: 720,
        image_url:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/House_finch_%2833688%292.jpg/300px-House_finch_%2833688%292.jpg',
        name: 'House Finch (Adult Male)',
      },
      stats: {
        detections: {
          detections_24h: 0,
          detections_30d: 3,
          detections_7d: 3,
        },
        hourlyActivity: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0,
          0,
        ],
      },
    },
    {
      species: {
        id: 721,
        image_url:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/House_finch_%2833688%292.jpg/300px-House_finch_%2833688%292.jpg',
        name: 'House Finch (Female/immature)',
      },
      stats: {
        detections: {
          detections_24h: 0,
          detections_30d: 1,
          detections_7d: 1,
        },
        hourlyActivity: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
          0,
        ],
      },
    },
  ],
};
