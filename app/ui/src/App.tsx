import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { FoodManagement } from './pages/FoodManagement';
import { BirdDirectory } from './pages/BirdDirectory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { VideoDetails } from './pages/VideoDetails';

const theme = createTheme({
  palette: {
    primary: {
      main: '#059669',
    },
    secondary: {
      main: '#0ea5e9',
    },
  },
});

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Navigation />
          <main>
            <Container>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/videos/:id" element={<VideoDetails />} />
                <Route path="/food" element={<FoodManagement />} />
                <Route path="/birds" element={<BirdDirectory />} />
              </Routes>
            </Container>
          </main>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
