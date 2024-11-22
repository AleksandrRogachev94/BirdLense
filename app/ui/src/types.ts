export interface BirdSighting {
  id: string;
  species: string;
  timestamp: string;
  duration: number;
  imageUrl: string;
  confidence: number;
  feedAmount?: number;
  foodItemId?: string;
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
