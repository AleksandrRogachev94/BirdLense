import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import GitHubIcon from '@mui/icons-material/GitHub';

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 1.5,
        px: 3,
        mt: 'auto',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        backgroundColor: 'transparent',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
        >
          BirdLense
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', opacity: 0.5 }}
        >
          ·
        </Typography>
        <Link
          href="https://github.com/AleksandrRogachev94/BirdLense"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
            textDecoration: 'none',
            fontSize: '0.8rem',
            transition: 'color 0.2s',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <GitHubIcon sx={{ fontSize: '1rem' }} />
          Open Source
        </Link>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', opacity: 0.5 }}
        >
          ·
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
        >
          MIT License
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', opacity: 0.5 }}
        >
          ·
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
        >
          Created by{' '}
          <Link
            href="https://github.com/AleksandrRogachev94"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
            }}
          >
            Aleksandr Rogachev
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
