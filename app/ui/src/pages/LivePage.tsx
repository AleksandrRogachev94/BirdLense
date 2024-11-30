import { useRef, useLayoutEffect } from 'react';
import { Box, Typography } from '@mui/material';

const MjpegStream = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  // It's crucial to use useLayoutEffect since it will trigger right before the html disappears
  // so that we can disconnect the stream before the component is unmounted
  useLayoutEffect(() => {
    // Set the stream source
    if (imgRef.current) {
      imgRef.current.src = '/processor/live';
    }

    return () => {
      if (imgRef.current) {
        imgRef.current.src = ''; // Disconnect the stream
      }
    };
  }, []);

  return <img width="100%" ref={imgRef} alt="Video Stream" />;
};

export const LivePage = () => {
  return (
    <Box>
      <Box>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h4" mb={3}>
            Live Stream
          </Typography>
        </Box>
      </Box>
      <MjpegStream />
    </Box>
  );
};
