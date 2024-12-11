import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchVideo } from '../../api/api';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Video } from '../../types';
import { VideoInfo } from './VideoInfo';
import { VideoPlayer } from './VideoPlayer';
import { PageHelp } from '../../components/PageHelp';
import { videoDetailsHelpConfig } from '../../page-help-config';

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
      <PageHelp {...videoDetailsHelpConfig} />
      <VideoPlayer video={video as Video} />
      <VideoInfo video={video as Video} />
    </>
  );
};
