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
  };
  food: {
    id: string;
    name: string;
  };
}

export interface TimelineGroup {
  date: string;
  sightings: BirdSighting[];
}

export interface FoodItem {
  id: string;
  name: string;
  type: 'seed' | 'suet' | 'nectar' | 'fruit' | 'insect';
  quantity: number;
  unit: 'g' | 'ml' | 'pieces';
  lastRefillDate: string;
  preferredBy: string[];
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
