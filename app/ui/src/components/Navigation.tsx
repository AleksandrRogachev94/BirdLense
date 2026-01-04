import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MUILink from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Divider from '@mui/material/Divider';
import { keyframes } from '@mui/system';

// Pulse animation for the live indicator
const pulse = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const NAVIGATION_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Timeline', path: '/timeline' },
  { label: 'Food Management', path: '/food' },
  { label: 'Bird Directory', path: '/species' },
] as const;

// Pill-shaped nav item styles (defined outside component to avoid recreation)
const navPillStyles = {
  px: 2.5,
  py: 1,
  borderRadius: '20px',
  fontSize: '0.9rem',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.75)',
  textDecoration: 'none',
  transition: 'all 0.2s',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  },
};

const activeNavPillStyles = {
  ...navPillStyles,
  bgcolor: 'rgba(255, 255, 255, 0.15)',
  color: 'white',
  fontWeight: 600,
};

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname.split('?')[0];

  const [mobileMenuAnchor, setMobileMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] =
    React.useState<null | HTMLElement>(null);

  const handleMobileMenuClose = () => setMobileMenuAnchor(null);
  const handleSettingsMenuClose = () => setSettingsMenuAnchor(null);

  return (
    <AppBar position="sticky" color="primary" sx={{ mb: 3 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          {/* Logo Section - Desktop (Clickable) */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              mr: 3,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': {
                opacity: 0.85,
              },
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="BirdLense Logo"
              sx={{ mr: 1.5, height: 40, width: 40, borderRadius: 1 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              BirdLense
            </Typography>
          </Box>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
              color="inherit"
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
              keepMounted
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                  },
                },
              }}
            >
              {/* Main Navigation Items */}
              {NAVIGATION_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={handleMobileMenuClose}
                  component={Link}
                  to={item.path}
                  selected={currentPath === item.path}
                >
                  {item.label}
                </MenuItem>
              ))}

              {/* Live View */}
              <MenuItem
                onClick={handleMobileMenuClose}
                component={Link}
                to="/live"
                selected={currentPath === '/live'}
                sx={{
                  color: '#ef4444',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                <FiberManualRecordIcon
                  sx={{
                    mr: 1,
                    fontSize: 14,
                    animation: `${pulse} 1.5s ease-in-out infinite`,
                  }}
                />
                Live View
              </MenuItem>

              {/* Settings Section */}
              <Divider />
              <MenuItem
                onClick={handleMobileMenuClose}
                component={Link}
                to="/settings"
                selected={currentPath === '/settings'}
              >
                <SettingsIcon sx={{ mr: 1, fontSize: 20 }} />
                Settings
              </MenuItem>
              <MenuItem
                onClick={handleMobileMenuClose}
                component={Link}
                to="/system"
                selected={currentPath === '/system'}
              >
                System
              </MenuItem>
              <MenuItem onClick={handleMobileMenuClose}>
                <MUILink
                  href="/data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  underline="none"
                  sx={{ display: 'block', width: '100%' }}
                >
                  Data Viewer
                </MUILink>
              </MenuItem>
            </Menu>
          </Box>

          {/* Logo Section - Mobile (Clickable) */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="BirdLense Logo"
              sx={{ mr: 1, height: 32, width: 32, borderRadius: 0.5 }}
            />
            <Typography variant="h6">BirdLense</Typography>
          </Box>

          {/* Desktop Navigation - Pill Style */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: 'none', md: 'flex' },
              gap: 0.5,
              alignItems: 'center',
            }}
          >
            {NAVIGATION_ITEMS.map((item) => (
              <Box
                key={item.path}
                component={Link}
                to={item.path}
                sx={
                  currentPath === item.path
                    ? activeNavPillStyles
                    : navPillStyles
                }
              >
                {item.label}
              </Box>
            ))}
          </Box>

          {/* Action Buttons - Desktop */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            {/* Live Button - Red with pulse */}
            <Button
              component={Link}
              to="/live"
              startIcon={
                <FiberManualRecordIcon
                  sx={{
                    fontSize: 12,
                    animation: `${pulse} 1.5s ease-in-out infinite`,
                  }}
                />
              }
              sx={{
                bgcolor: currentPath === '/live' ? '#dc2626' : '#ef4444',
                color: 'white',
                px: 2.5,
                py: 0.75,
                borderRadius: '20px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow:
                  currentPath === '/live'
                    ? '0 0 20px rgba(239, 68, 68, 0.5)'
                    : '0 0 12px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#dc2626',
                  boxShadow: '0 0 24px rgba(239, 68, 68, 0.6)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Live
            </Button>

            {/* Settings Icon */}
            <IconButton
              color="inherit"
              onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
              aria-label="settings"
              aria-controls="settings-menu"
              aria-expanded={Boolean(settingsMenuAnchor)}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>

          {/* Settings Menu - Desktop */}
          <Menu
            id="settings-menu"
            anchorEl={settingsMenuAnchor}
            open={Boolean(settingsMenuAnchor)}
            onClose={handleSettingsMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 2,
                  mt: 1,
                  minWidth: 160,
                },
              },
            }}
          >
            <MenuItem
              component={Link}
              to="/settings"
              onClick={handleSettingsMenuClose}
              selected={currentPath === '/settings'}
            >
              Settings
            </MenuItem>
            <MenuItem
              component={Link}
              to="/system"
              onClick={handleSettingsMenuClose}
              selected={currentPath === '/system'}
            >
              System
            </MenuItem>
            <MenuItem onClick={handleSettingsMenuClose}>
              <MUILink
                href="/data/"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="none"
                sx={{ display: 'block', width: '100%' }}
              >
                Data Viewer
              </MUILink>
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
