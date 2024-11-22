import { Dayjs } from 'dayjs';
import { mockBirdSighting } from './mocks';

export const fetchSightings = async (date: Dayjs | null) => {
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('Fetching sightings for', date?.format('YYYY-MM-DD'));
  return mockBirdSighting;
};
