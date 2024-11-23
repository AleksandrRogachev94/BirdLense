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

export interface Video {
  id: string;
  processor_version: string;
  start_time: string;
  end_time: string;
  video_path: string;
  audio_path: string;
  favorite: boolean;
  weather: {
    main: string;
    description: string;
    temp: number;
    humidity: number;
    pressure: number;
    clouds: number;
    wind_speed: number;
  };
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
  id: string;
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
