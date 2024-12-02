import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Navigation } from './components/Navigation';
import { TimelinePage } from './pages/Timeline';
import { FoodManagement } from './pages/FoodManagement';
import { BirdDirectory } from './pages/BirdDirectory';
import { Settings } from './pages/Settings';
import { Overview } from './pages/Overview';
import { LivePage } from './pages/Live';
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
                <Route path="/" element={<Overview />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/videos/:id" element={<VideoDetails />} />
                <Route path="/food" element={<FoodManagement />} />
                <Route path="/birds" element={<BirdDirectory />} />
                <Route path="/live" element={<LivePage />} />
                <Route path="/settings" element={<Settings />} />
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
