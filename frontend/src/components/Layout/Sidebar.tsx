import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Dashboard,
  Person,
  Schedule,
  Place,
  PeopleAlt,
  Store,
  Description,
  AccountBalance,
  SupervisorAccount,
  Event,
  Assessment,
  ConfirmationNumber,
  Business,
  Settings,
  TableChart,
  Assignment,
  Dashboard as ContractDashboard,
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFestival } from '../../contexts/FestivalContext';

const drawerWidth = 280;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();
  const { user } = useAuth();
  const { currentFestival } = useFestival();

  const getMenuItems = () => {
    if (eventId) {
      // Event-specific menu items
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: `/event/${eventId}/dashboard`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Stages & Areas', icon: <Place />, path: `/event/${eventId}/venues`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Artists', icon: <Person />, path: `/event/${eventId}/artists`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Schedule', icon: <Schedule />, path: `/event/${eventId}/schedule`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Timetable', icon: <TableChart />, path: `/event/${eventId}/timetable`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Contracts', icon: <Assignment />, path: `/event/${eventId}/contracts`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Volunteers', icon: <PeopleAlt />, path: `/event/${eventId}/volunteers`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Vendors', icon: <Store />, path: `/event/${eventId}/vendors`, roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Documents', icon: <Description />, path: `/event/${eventId}/documents`, roles: ['admin', 'manager', 'coordinator'] },
        { text: 'Budget', icon: <AccountBalance />, path: `/event/${eventId}/budget`, roles: ['admin', 'manager'] },
        { text: 'Ticketing', icon: <ConfirmationNumber />, path: `/event/${eventId}/ticketing`, roles: ['admin', 'manager', 'coordinator'] },
        { text: 'Reports', icon: <Assessment />, path: `/event/${eventId}/reports`, roles: ['admin', 'manager', 'coordinator'] },
        { text: 'Settings', icon: <Settings />, path: `/event/${eventId}/settings`, roles: ['admin', 'manager'] },
      ];
    } else {
      // System-level menu items
      return [
        { text: 'System Dashboard', icon: <Dashboard />, path: '/system', roles: ['admin', 'manager', 'coordinator', 'read_only'] },
        { text: 'Events', icon: <Event />, path: '/festivals', roles: ['admin', 'manager', 'coordinator'] },
        { text: 'Venue Locations', icon: <Business />, path: '/venue-locations', roles: ['admin', 'manager', 'coordinator'] },
        { text: 'Users', icon: <SupervisorAccount />, path: '/users', roles: ['admin'] },
      ];
    }
  };

  const menuItems = getMenuItems();

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box sx={{ height: '72px', display: 'flex', alignItems: 'center', px: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: '#1976d2',
          }}
        >
          Festival Manager
        </Typography>
      </Box>
      
      {eventId && (
        <Box sx={{ 
          mx: 2, 
          mt: 3,
          mb: 3, 
          p: 3,
          backgroundColor: '#1976d2',
          borderRadius: 2,
          color: 'white',
          '&:hover': {
            backgroundColor: '#1565c0',
          }
        }}>
          <Typography variant="caption" sx={{ 
            display: 'block', 
            fontWeight: 500, 
            opacity: 0.9,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.7rem'
          }}>
            Event Dashboard
          </Typography>
          {currentFestival && (
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 2,
              fontSize: '1rem',
              lineHeight: 1.3,
              color: 'white'
            }}>
              {currentFestival.name} {currentFestival.year}
            </Typography>
          )}
          <Button
            size="small"
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.3)',
              borderRadius: 1.5,
              fontSize: '0.75rem',
              px: 2,
              py: 0.5,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { 
                borderColor: 'rgba(255,255,255,0.6)', 
                bgcolor: 'rgba(255,255,255,0.1)' 
              }
            }}
            variant="outlined"
            onClick={() => navigate('/system')}
          >
            ← Back to System
          </Button>
        </Box>
      )}
      
      {!eventId && (
        <Box sx={{ 
          mx: 2, 
          mt: 3,
          mb: 3, 
          p: 3,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="caption" sx={{ 
            display: 'block', 
            fontWeight: 500, 
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.7rem'
          }}>
            System Overview
          </Typography>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            fontSize: '1rem',
            mt: 0.5
          }}>
            Main Dashboard
          </Typography>
        </Box>
      )}
      
      <List sx={{ px: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                '&.Mui-selected': {
                  backgroundColor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                py: 1.5,
                px: 2,
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 36,
                color: location.pathname === item.path ? 'white' : 'text.secondary'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '0.9rem',
                  color: location.pathname === item.path ? 'white' : 'inherit'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;