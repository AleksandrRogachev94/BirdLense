import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import MUILink from '@mui/material/Link';
import SettingsIcon from '@mui/icons-material/Settings';

const pages = [
  { label: 'Overview', url: '/' },
  { label: 'Timeline', url: '/timeline' },
  { label: 'Food Management', url: '/food' },
  { label: 'Bird Directory', url: '/birds' },
];

export function Navigation() {
  const location = useLocation();
  const currentTab = pages.findIndex((page) => {
    const locationWithoutQuery = location.pathname.split('?')[0];
    return page.url === locationWithoutQuery;
  });

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null,
  );
  const [anchorElSettings, setAnchorElSettings] =
    React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  const handleOpenSettingsMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElSettings(event.currentTarget);
  const handleCloseSettingsMenu = () => setAnchorElSettings(null);

  const renderTabs = () => (
    <Tabs
      value={Math.max(currentTab, 0)}
      textColor="inherit"
      indicatorColor="secondary"
    >
      {pages.map((page) => (
        <Tab
          key={page.label}
          label={page.label}
          component={Link}
          to={page.url}
        />
      ))}
    </Tabs>
  );

  const renderMobileMenu = () => (
    <Menu
      id="menu-appbar"
      anchorEl={anchorElNav}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      open={Boolean(anchorElNav)}
      onClose={handleCloseNavMenu}
    >
      {pages.map((page) => (
        <MenuItem
          key={page.label}
          onClick={handleCloseNavMenu}
          component={Link}
          to={page.url}
        >
          <Typography textAlign="center">{page.label}</Typography>
        </MenuItem>
      ))}
    </Menu>
  );

  const renderSettingsMenu = () => (
    <Menu
      id="settings-menu"
      anchorEl={anchorElSettings}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(anchorElSettings)}
      onClose={handleCloseSettingsMenu}
    >
      <MenuItem
        onClick={handleCloseSettingsMenu}
        component={Link}
        to="/settings"
      >
        <Typography textAlign="center">Settings</Typography>
      </MenuItem>
      <MenuItem onClick={handleCloseSettingsMenu}>
        <MUILink
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'none' } }}
          href="/data/" // replace with actual URL
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
        >
          Data Viewer
        </MUILink>
      </MenuItem>
    </Menu>
  );

  return (
    <AppBar position="static" color="primary" sx={{ mb: 4 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <EmojiNatureIcon
            sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}
          />
          <Typography
            variant="h6"
            sx={{ flexGrow: 0, mr: 4, display: { xs: 'none', md: 'flex' } }}
          >
            Smart Bird Feeder
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            {renderMobileMenu()}
          </Box>

          <Typography
            variant="h6"
            sx={{ flexGrow: 0, mr: 4, display: { xs: 'flex', md: 'none' } }}
          >
            Smart Bird Feeder
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {renderTabs()}
          </Box>

          {/* Settings Icon and Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <IconButton
              size="large"
              onClick={handleOpenSettingsMenu}
              color="inherit"
            >
              <SettingsIcon />
            </IconButton>
            {renderSettingsMenu()}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
