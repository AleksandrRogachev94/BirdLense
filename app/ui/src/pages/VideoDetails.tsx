import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchVideo } from '../api/api';
import { Box, CircularProgress } from '@mui/material';
import { Video } from '../types';
import { VideoInfo } from '../components/VideoInfo';
import { VideoPlayer } from '../components/VideoPlayer';

export const VideoDetails = () => {
  const params = useParams();
  const {
    data: video,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['video', params.id],
    queryFn: () => fetchVideo(params.id as string),
  });

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error loading sightings data.</div>;

  return (
    <>
      <VideoPlayer video={video as Video} />
      <VideoInfo video={video as Video} />
    </>
  );
};
