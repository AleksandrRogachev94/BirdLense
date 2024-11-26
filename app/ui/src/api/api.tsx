import { Dayjs } from 'dayjs';
import {
  mockBirdDirectory,
  mockBirdFood,
  mockBirdSighting,
  mockOverviewData,
  mockSetttings,
  mockVideo,
  mockWeather,
} from './mocks';
import { BirdFood, BirdSighting, Settings } from '../types';
import axios from 'axios';

const useMockData = false; // Set to false to use real API calls
export const BASE_URL = 'http://smartbirdfeeder:8000';
export const BASE_API_URL = `${BASE_URL}/api/ui`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchTimeline = async (
  startTime: Dayjs,
  endTime: Dayjs,
): Promise<BirdSighting[]> => {
  if (useMockData) {
    await sleep(1000);
    return mockBirdSighting;
  } else {
    const response = await axios.get(`${BASE_API_URL}/timeline`, {
      params: {
        start_time: startTime.unix(),
        end_time: endTime.unix(),
      },
    });
    return response.data;
  }
};

export const fetchWeather = async () => {
  if (useMockData) {
    await sleep(1000);
    return mockWeather;
  } else {
    const response = await axios.get(`${BASE_API_URL}/weather`);
    return response.data;
  }
};

export const fetchVideo = async (id: string) => {
  if (useMockData) {
    await sleep(1000);
    return mockVideo;
  } else {
    const response = await axios.get(`${BASE_API_URL}/videos/${id}`);
    return response.data;
  }
};

export const fetchBirdFood = async (): Promise<BirdFood[]> => {
  if (useMockData) {
    await sleep(1000);
    return mockBirdFood;
  } else {
    const response = await axios.get(`${BASE_URL}/bird-food`);
    return response.data;
  }
};

export const toggleBirdFood = async (id: number) => {
  if (useMockData) {
    await sleep(1000);
    const food = mockBirdFood.find((item) => item.id === id);
    if (food) food.active = !food.active;
    return food;
  } else {
    const response = await axios.post(`${BASE_API_URL}/bird-food/${id}/toggle`);
    return response.data;
  }
};

export const addBirdFood = async (newFood: Partial<BirdFood>) => {
  if (useMockData) {
    await sleep(1000);
    mockBirdFood.unshift({ id: 10, active: true, ...newFood } as BirdFood);
    return newFood;
  } else {
    const response = await axios.post(`${BASE_API_URL}/bird-food`, newFood);
    return response.data;
  }
};

export const fetchSettings = async () => {
  if (useMockData) {
    await sleep(1000);
    return mockSetttings;
  } else {
    const response = await axios.get(`${BASE_API_URL}/settings`);
    return response.data;
  }
};

export const updateSettings = async (settings: Settings) => {
  if (useMockData) {
    await sleep(1000);
    return settings;
  } else {
    const response = await axios.put(`${BASE_API_URL}/settings`, settings);
    return response.data;
  }
};

export const fetchCoordinatesByZip = async (
  zip: string,
): Promise<{ lat: string; lon: string }> => {
  if (useMockData) {
    await sleep(1000);
    return { lat: '40.7128', lon: '-74.0060' }; // Mock coordinates
  } else {
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
  }
};

export const fetchBirdDirectory = async (active: boolean) => {
  if (useMockData) {
    await sleep(1000);
    return mockBirdDirectory;
  } else {
    const response = await axios.get(`${BASE_API_URL}/species`, {
      params: { active },
    });
    return response.data;
  }
};

export const fetchOverviewData = async () => {
  if (useMockData) {
    await sleep(1000);
    return mockOverviewData;
  } else {
    const response = await axios.get(`${BASE_API_URL}/overview`);
    return response.data;
  }
};
