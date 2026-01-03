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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MUILink from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import Divider from '@mui/material/Divider';

const NAVIGATION_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Timeline', path: '/timeline' },
  { label: 'Food Management', path: '/food' },
  { label: 'Bird Directory', path: '/species' },
] as const;

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname.split('?')[0];

  const currentTabValue = React.useMemo(() => {
    const index = NAVIGATION_ITEMS.findIndex(
      (item) => item.path === currentPath,
    );
    return index >= 0 ? index : false;
  }, [currentPath]);

  const [mobileMenuAnchor, setMobileMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] =
    React.useState<null | HTMLElement>(null);

  const handleMobileMenuClose = () => setMobileMenuAnchor(null);
  const handleSettingsMenuClose = () => setSettingsMenuAnchor(null);

  return (
    <AppBar position="sticky" color="primary" sx={{ mb: 3 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo Section - Desktop */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              mr: 4, // Moved margin from Typography to container for better click area
              '&:hover': {
                opacity: 0.9,
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
              >
                <LiveTvIcon sx={{ mr: 1 }} />
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
                <SettingsIcon sx={{ mr: 1 }} />
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

          {/* Logo Section - Mobile */}
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

          {/* Desktop Navigation Tabs */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Tabs
              value={currentTabValue}
              textColor="inherit"
              indicatorColor="secondary"
              aria-label="navigation tabs"
              sx={{
                '& .MuiTab-root': {
                  color: 'white',
                  opacity: 0.7,
                  '&.Mui-selected': {
                    color: 'white',
                    opacity: 1,
                  },
                },
              }}
            >
              {NAVIGATION_ITEMS.map((item, index) => (
                <Tab
                  key={item.path}
                  label={item.label}
                  component={Link}
                  to={item.path}
                  value={index}
                />
              ))}
            </Tabs>
          </Box>

          {/* Action Buttons - Desktop */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Button
              component={Link}
              to="/live"
              color="inherit"
              startIcon={<LiveTvIcon />}
              sx={{
                bgcolor:
                  currentPath === '/live'
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              Live
            </Button>
            <IconButton
              color="inherit"
              onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
              aria-label="settings"
              aria-controls="settings-menu"
              aria-expanded={Boolean(settingsMenuAnchor)}
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
