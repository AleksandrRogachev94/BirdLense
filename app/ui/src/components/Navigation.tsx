import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { Bird } from 'lucide-react';

export function Navigation() {
  const location = useLocation();
  const paths = ['/', '/food', '/birds'];
  const currentTab = paths.indexOf(location.pathname);

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Bird className="w-8 h-8 mr-2" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Smart Bird Feeder
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Tabs 
            value={currentTab} 
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Timeline" component={Link} to="/" />
            <Tab label="Food Management" component={Link} to="/food" />
            <Tab label="Bird Directory" component={Link} to="/birds" />
          </Tabs>
        </Box>
        <Typography variant="body2">
          Last Update: {new Date().toLocaleString()}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}