import { Dayjs } from 'dayjs';
import { mockBirdSighting, mockVideo } from './mocks';

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
