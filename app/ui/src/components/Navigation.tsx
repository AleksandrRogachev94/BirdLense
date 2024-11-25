import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  EmojiNature as EmojiNatureIcon,
} from '@mui/icons-material';

const pages = [
  { label: 'Overview', url: '/' },
  { label: 'Timeline', url: '/timeline' },
  { label: 'Food Management', url: '/food' },
  { label: 'Bird Directory', url: '/birds' },
  { label: 'Settings', url: '/settings' },
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

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

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
        </Toolbar>
      </Container>
    </AppBar>
  );
}
