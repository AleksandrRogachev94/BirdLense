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
import SpeciesSummary from './pages/SpeciesSummary';
import { System } from './pages/System';

const theme = createTheme({
  palette: {
    primary: {
      main: '#043D34', // Deep Jungle
      light: '#10B981', // Vibrant Emerald (for buttons/accents)
    },
    secondary: {
      main: '#0EA5E9', // Tech Blue
    },
  },
});

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });

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
                <Route path="/species" element={<BirdDirectory />} />
                <Route path="/live" element={<LivePage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/species/:id" element={<SpeciesSummary />} />
                <Route path="/system" element={<System />} />
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
