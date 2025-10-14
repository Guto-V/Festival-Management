import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Alert,
} from '@mui/material';
import {
  Event,
  Business,
  People,
  Add,
  Settings,
  Dashboard as DashboardIcon,
  CalendarToday,
  LocationOn,
  PersonAdd,
  AccountCircle,
  Launch,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface SystemEvent {
  id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  venue_name?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  budget_total: number;
}

interface VenueLocation {
  id: number;
  name: string;
  city?: string;
  country: string;
  capacity?: number;
  is_active: boolean;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface SystemStats {
  totalEvents: number;
  activeEvents: number;
  totalVenues: number;
  totalUsers: number;
}

const SystemDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [recentVenues, setRecentVenues] = useState<VenueLocation[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalVenues: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsRes, venuesRes, usersRes] = await Promise.all([
        axios.get('/api/festivals'),
        axios.get('/api/venue-locations'),
        user?.role === 'admin' ? axios.get('/api/users') : Promise.resolve({ data: [] }),
      ]);

      const events = eventsRes.data;
      const venues = venuesRes.data;
      const users = user?.role === 'admin' ? usersRes.data : [];

      setRecentEvents(events.slice(0, 5));
      setRecentVenues(venues.slice(0, 5));
      setRecentUsers(users.slice(0, 5));
      
      setStats({
        totalEvents: events.length,
        activeEvents: events.filter((e: SystemEvent) => e.status === 'active').length,
        totalVenues: venues.length,
        totalUsers: users.length,
      });
    } catch (error) {
      console.error('Failed to fetch system data:', error);
      setError('Failed to load system data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Loading system data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Event Management System
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Select an event to manage or create a new event
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => window.location.href = '/festivals'}
          >
            Create New Event
          </Button>
          <Button
            variant="outlined"
            startIcon={<Business />}
            onClick={() => window.location.href = '/venue-locations'}
          >
            Manage Venues
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => window.location.href = '/users'}
            >
              Manage Users
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Your Events - Full Width */}
      <Box sx={{ mb: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Your Events</Typography>
              <Button 
                size="small" 
                onClick={() => window.location.href = '/festivals'}
              >
                Manage All Events
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentEvents.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {event.name}
                          </Typography>
                          {event.venue_name && (
                            <Typography variant="caption" color="textSecondary">
                              at {event.venue_name}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(event.start_date)} - {formatDate(event.end_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.status}
                          color={getStatusColor(event.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => window.location.href = `/event/${event.id}/dashboard`}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            No events found. Create your first event to get started!
                          </Typography>
                          <Button 
                            variant="contained" 
                            startIcon={<Add />}
                            onClick={() => window.location.href = '/festivals'}
                            sx={{ mt: 2 }}
                          >
                            Create First Event
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Statistics Cards - Bottom Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: user?.role === 'admin' ? 'repeat(2, 1fr)' : '1fr' }, gap: 3, mb: 4 }}>
        <Card sx={{ cursor: 'pointer' }} onClick={() => window.location.href = '/venue-locations'}>
          <CardContent sx={{ textAlign: 'center', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 2 }}>
            <Business sx={{ fontSize: 32, color: '#1976d2', mb: 1, mx: 'auto' }} />
            <Box>
              <Typography variant="h5">{stats.totalVenues}</Typography>
              <Typography variant="body2" color="textSecondary">Venue Locations</Typography>
            </Box>
          </CardContent>
        </Card>
        {user?.role === 'admin' && (
          <Card 
            sx={{ cursor: 'pointer' }} 
            onClick={() => window.location.href = '/users'}
          >
            <CardContent sx={{ textAlign: 'center', height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 2 }}>
              <People sx={{ fontSize: 32, color: '#1976d2', mb: 1, mx: 'auto' }} />
              <Box>
                <Typography variant="h5">{stats.totalUsers}</Typography>
                <Typography variant="body2" color="textSecondary">System Users</Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default SystemDashboard;