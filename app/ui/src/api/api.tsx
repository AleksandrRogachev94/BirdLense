import { Dayjs } from 'dayjs';
import {
  mockBirdFood,
  mockBirdSighting,
  mockSetttings,
  mockVideo,
} from './mocks';
import { BirdFood, Settings } from '../types';
import axios from 'axios';

export const fetchSightings = async (date: Dayjs | null) => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Fetching sightings for', date?.format('YYYY-MM-DD'));
  return mockBirdSighting;
};

export const fetchVideo = async (id: string) => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Fetching video id', id);
  return mockVideo;
};

export const fetchBirdFood = async (): Promise<BirdFood[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockBirdFood]), 500); // Simulates API latency
  });
};

export const toggleBirdFood = async (id: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const food = mockBirdFood.find((item) => item.id === id);
      if (food) food.active = !food.active;
      resolve(food);
    }, 300); // Simulates API latency
  });
};

export const fetchSettings = async () => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Fetching settings');
  return mockSetttings;
};

// Update settings API
export const updateSettings = async (settings: Settings) => {
  console.log('Updated settings:', settings);
  return settings;
};

// Fetch coordinates from OpenStreetMap
export const fetchCoordinatesByZip = async (
  zip: string,
): Promise<{ lat: string; lon: string }> => {
  const response = await axios.get(
    'https://nominatim.openstreetmap.org/search',
    {
      params: {
        format: 'json',
        postalcode: zip,
        countrycodes: 'us',
      },
    },
  );
  const data = response.data;

  if (data && data.length > 0) {
    return {
      lat: data[0].lat,
      lon: data[0].lon,
    };
  } else {
    throw new Error('Invalid ZIP code or no data found.');
  }
};
