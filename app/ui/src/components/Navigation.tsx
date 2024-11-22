// import { Link, useLocation } from 'react-router-dom';
// import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
// import { Bird } from 'lucide-react';

// export function Navigation() {
//   const location = useLocation();
//   const paths = ['/', '/food', '/birds'];
//   const currentTab = paths.indexOf(location.pathname);

//   return (
//     <AppBar position="static" color="primary">
//       <Toolbar>
//         <Bird className="w-8 h-8 mr-2" />
//         <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
//           Smart Bird Feeder
//         </Typography>
//         <Box sx={{ flexGrow: 1 }}>
//           <Tabs
//             value={currentTab}
//             textColor="inherit"
//             indicatorColor="secondary"
//           >
//             <Tab label="Timeline" component={Link} to="/" />
//             <Tab label="Food Management" component={Link} to="/food" />
//             <Tab label="Bird Directory" component={Link} to="/birds" />
//           </Tabs>
//         </Box>
//         <Typography variant="body2">
//           Last Update: {new Date().toLocaleString()}
//         </Typography>
//       </Toolbar>
//     </AppBar>
//   );
// }

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';

const pages = ['Products', 'Pricing', 'Blog'];

export function Navigation() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <EmojiNatureIcon
            sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 0, mr: 4, display: { xs: 'none', md: 'flex' } }}
          >
            Smart Bird Feeder
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem key={page} onClick={handleCloseNavMenu}>
                  <Typography sx={{ textAlign: 'center' }}>{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <EmojiNatureIcon
            sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 0, mr: 4, display: { xs: 'flex', md: 'none' } }}
          >
            Smart Bird Feeder
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
