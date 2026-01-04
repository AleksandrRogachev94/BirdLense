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
    mode: 'dark',
    background: {
      default: '#0F172A', // Slate 900
      paper: '#1E293B', // Slate 800
    },
    primary: {
      main: '#10B981', // Emerald 500
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0EA5E9', // Sky 500
      contrastText: '#ffffff',
    },
    text: {
      primary: '#F8FAFC', // Slate 50
      secondary: '#94A3B8', // Slate 400
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#334155 #0F172A',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#0F172A',
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#334155',
            minHeight: 24,
            border: '2px solid #0F172A',
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus':
            {
              backgroundColor: '#475569',
            },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
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
          <main style={{ paddingBottom: '2em' }}>
            <Container maxWidth="xl">
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
