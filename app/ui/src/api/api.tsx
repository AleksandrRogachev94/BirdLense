import { Dayjs } from 'dayjs';
import { mockBirdFood, mockBirdSighting, mockVideo } from './mocks';
import { BirdFood } from '../types';

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
