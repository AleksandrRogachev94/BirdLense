export interface SpeciesVisit {
  id: number;
  start_time: string;
  end_time: string;
  max_simultaneous: number;
  weather?: {
    temp?: number;
    clouds?: number;
  };
  species: {
    id: number;
    name: string;
    image_url?: string;
    parent_id?: number;
  };
  detections: {
    video_id: number;
    start_time: string;
    end_time: string;
    confidence: number;
    source: 'video' | 'audio';
  }[];
}

export interface VideoSpecies {
  species_id: number;
  species_name: string;
  start_time: number; // seconds from video start time
  end_time: number; // seconds from video start time
  confidence: number;
  source: string;
  image_url?: string;
}

export interface Weather {
  main: string;
  description: string;
  temp: number;
  humidity: number;
  pressure: number;
  clouds: number;
  wind_speed: number;
}

export interface Video {
  id: string;
  processor_version: string;
  start_time: string;
  end_time: string;
  video_path: string;
  spectrogram_path: string;
  favorite: boolean;
  weather: Weather;
  species: VideoSpecies[];
  food: {
    id: string;
    name: string;
  }[];
}

export interface BirdFood {
  id: number;
  name: string;
  active: boolean;
  description?: string;
  image_url?: string;
}

export interface BirdTaxonomy {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  order: string;
  imageUrl: string;
  preferredFood: string[];
  description: string;
  isCommonVisitor: boolean;
}

export interface Settings {
  general: {
    enable_notifications: boolean; // Whether to enable notifications or not
  };
  processor: {
    video_width: number; // Video width in pixels, e.g., 1280
    video_height: number; // Video height in pixels, e.g., 720
    tracker: string; // Path to tracker config, e.g., "bytetrack.yaml"
    max_record_seconds: number; // Max recording duration in seconds
    max_inactive_seconds: number; // Max inactivity before stopping recording
    save_images: boolean; // Whether to save images or not
  };
  secrets: {
    openweather_api_key: string; // API key for OpenWeather
    latitude: string; // Latitude as a string, e.g., "YOUR_LATITUDE_HERE"
    longitude: string; // Longitude as a string, e.g., "YOUR_LONGITUDE_HERE"
    zip?: string;
  };
}

export interface Species {
  id: number;
  name: string;
  parent_id: number | null;
  parent?: {
    name: string;
    id: string;
  };
  created_at: string;
  image_url: string | null;
  description: string | null;
  active: boolean;
  count?: number;
}

export interface OverviewTopSpecies {
  id: number;
  name: string;
  detections: number[]; // hourly count of detections, 24 values
}

export interface OverviewStats {
  uniqueSpecies: number;
  totalDetections: number;
  lastHourDetections: number;
  videoDuration: number;
  audioDuration: number;
  busiestHour: number;
  avgVisitDuration: number;
}

export interface OverviewData {
  topSpecies: OverviewTopSpecies[];
  stats: OverviewStats;
}

export interface DetectionCounts {
  detections_24h: number;
  detections_7d: number;
  detections_30d: number;
}

export interface TimestampRange {
  first_sighting: string | null;
  last_sighting: string | null;
}

export interface SpeciesSummary {
  species: Partial<Species>;

  // Aggregate stats
  stats: {
    detections: DetectionCounts;
    timeRange: TimestampRange;
    hourlyActivity: number[];
    weather: Array<{
      temp: number;
      clouds: number;
      count: number;
    }>;
    food: Array<{
      name: string;
      count: number;
    }>;
  };

  // Child species summaries
  subspecies: Array<{
    species: Partial<Species>;
    stats: {
      detections: DetectionCounts;
      hourlyActivity: number[];
    };
  }>;

  recentVisits: SpeciesVisit[]
}
