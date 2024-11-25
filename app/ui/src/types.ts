export interface BirdSighting {
  id: string;
  video_id: string;
  start_time: string;
  end_time: string;
  confidence: number;
  source: string;
  weather: {
    temp: number;
    clouds: number;
  };
  species: {
    id: string;
    name: string;
    image_url?: string;
  };
  food: {
    id: string;
    name: string;
  };
}

export interface VideoSpecies {
  species_id: string;
  species_name: string;
  start_time: string;
  end_time: string;
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
  audio_path: string;
  favorite: boolean;
  weather: Weather;
  species: VideoSpecies[];
  food: {
    id: string;
    name: string;
  }[];
}

export interface TimelineGroup {
  date: string;
  sightings: BirdSighting[];
}

export interface BirdFood {
  id: number;
  name: string;
  active: boolean;
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
  web: {
    host: string; // Host address, e.g., "0.0.0.0"
    port: number; // Port number, e.g., 8080
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
  created_at: string;
  photo: string | null;
  description: string | null;
  active: boolean;
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
  videoDetections: number;
  audioDetections: number;
  busiestHour: number;
}

export interface OverviewData {
  topSpecies: OverviewTopSpecies[];
  stats: OverviewStats;
}
