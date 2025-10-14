import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  Button,
} from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFestival } from '../../contexts/FestivalContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentFestival } = useFestival();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Check if we're on a system-level page
  const isSystemPage = location.pathname === '/system' || 
                       location.pathname === '/festivals' || 
                       location.pathname === '/venue-locations' || 
                       location.pathname === '/users';

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: '#212121'
      }}
    >
      <Toolbar sx={{ height: '72px', px: 3 }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: '#1976d2'
          }}
        >
          🎪 Festival Manager
        </Typography>
        
        {user && currentFestival && !isSystemPage && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 3,
            px: 2,
            py: 1,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Button
              variant="text"
              size="small"
              sx={{ 
                color: '#424242',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { 
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  color: '#1976d2'
                }
              }}
              onClick={() => navigate('/system')}
            >
              📅 {currentFestival.name} {currentFestival.year}
            </Button>
          </Box>
        )}
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 500,
                color: '#212121'
              }}>
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#424242',
                textTransform: 'capitalize'
              }}>
                {user.role}
              </Typography>
            </Box>
            <IconButton
              size="medium"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <Avatar sx={{ 
                width: 36, 
                height: 36,
                bgcolor: '#1976d2',
                fontSize: '1rem'
              }}>
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{
                mt: 1,
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  minWidth: 180,
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                <ExitToApp sx={{ mr: 2, color: '#424242' }} />
                <Typography sx={{ fontWeight: 500 }}>
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;