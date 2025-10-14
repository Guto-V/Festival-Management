import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  CardActions,
} from '@mui/material';
import {
  Event,
  Launch,
  CalendarToday,
  LocationOn,
  AttachMoney,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface EventData {
  id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  venue_name?: string;
  location?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  budget_total: number;
  description?: string;
}

const EventSelection: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/festivals');
      // Filter events based on user permissions (this will be enhanced with user-event associations)
      const userEvents = response.data.filter((event: EventData) => {
        // For now, show all events to admins and managers, active events to others
        if (user?.role === 'admin' || user?.role === 'manager') {
          return true;
        }
        return event.status === 'active' || event.status === 'planning';
      });
      setEvents(userEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (eventId: number) => {
    // Navigate to event-specific dashboard
    window.location.href = `/event/${eventId}/dashboard`;
  };

  const handleBackToSystem = () => {
    window.location.href = '/system';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'primary';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Loading events...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      py: 4,
      px: 3
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Select an Event
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Choose an event to access its management dashboard
          </Typography>
          <Button 
            variant="outlined" 
            onClick={handleBackToSystem}
            sx={{ mt: 2 }}
          >
            ← Back to System Dashboard
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {events.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Events Available
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You don't have access to any events yet. Contact your administrator to get access to events.
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleBackToSystem}
                sx={{ mt: 2 }}
              >
                Go to System Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {events.map((event) => (
              <Box key={event.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {event.name} {event.year}
                      </Typography>
                      <Chip
                        label={event.status}
                        color={getStatusColor(event.status) as any}
                        size="small"
                      />
                    </Box>

                    {event.description && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {event.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="body2">
                        {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {event.venue_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">
                          {event.venue_name}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AttachMoney fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatCurrency(event.budget_total)} Budget
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Launch />}
                      onClick={() => handleSelectEvent(event.id)}
                    >
                      Open Event Dashboard
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EventSelection;