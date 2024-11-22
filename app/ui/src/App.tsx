import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { FoodManagement } from './pages/FoodManagement';
import { BirdDirectory } from './pages/BirdDirectory';

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/food" element={<FoodManagement />} />
            <Route path="/birds" element={<BirdDirectory />} />
          </Routes>
        </main>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
