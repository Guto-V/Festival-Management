import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Button } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { FestivalProvider, useFestival } from './contexts/FestivalContext';
import { EventProvider } from './contexts/EventContext';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Login from './pages/Login';
import SystemDashboard from './pages/SystemDashboard';
import EventSelection from './pages/EventSelection';
import Dashboard from './pages/Dashboard';
import Artists from './pages/Artists';
import Schedule from './pages/Schedule';
import Venues from './pages/Venues';
import VenueLocations from './pages/VenueLocations';
import Volunteers from './pages/Volunteers';
import Vendors from './pages/Vendors';
import Documents from './pages/Documents';
import Budget from './pages/Budget';
import Users from './pages/Users';
import Festivals from './pages/Festivals';
import Reports from './pages/Reports';
import Ticketing from './pages/Ticketing';
import Settings from './pages/Settings';
import Timetable from './pages/Timetable';
import VolunteerRegistration from './pages/VolunteerRegistration';
import ContractSigning from './pages/ContractSigning';
import ContractDashboard from './pages/ContractDashboard';
import ErrorBoundary from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Clean blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#2e7d32', // Professional green
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#f5f5f5', // Light gray
      paper: '#ffffff',
    },
    text: {
      primary: '#212121', // High contrast dark
      secondary: '#424242', // Medium contrast gray
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
    },
    error: {
      main: '#d32f2f',
      light: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#212121',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: '#212121',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      color: '#212121',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: '#212121',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      color: '#212121',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#212121',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#424242',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#424242',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        contained: {
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          marginTop: '72px',
          marginLeft: '280px',
          minHeight: 'calc(100vh - 72px)',
          transition: 'all 0.3s ease-in-out',
          pt: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3, md: 4 },
          pl: 0,
          ml: '70px',
          pr: 0,
          mr: '80px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const EventGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <EventProvider>
      <FestivalProvider>
        <EventGuardInner>{children}</EventGuardInner>
      </FestivalProvider>
    </EventProvider>
  );
};

const EventGuardInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { eventId } = useParams();
  const { currentFestival, switchFestival, loading } = useFestival();
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      if (eventId && (!currentFestival || currentFestival.id.toString() !== eventId)) {
        try {
          await switchFestival(parseInt(eventId));
        } catch (error) {
          console.error('Failed to switch to event:', error);
        }
      }
      setEventLoading(false);
    };

    if (eventId) {
      loadEvent();
    } else {
      setEventLoading(false);
    }
  }, [eventId, currentFestival, switchFestival]);

  if (loading || eventLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading event...</Typography>
      </Box>
    );
  }

  if (!currentFestival && eventId) {
    return <EventNotFoundComponent />;
  }

  if (!currentFestival) {
    return <EventSelection />;
  }

  return <>{children}</>;
};

const EventNotFoundComponent: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Typography>Event not found or access denied.</Typography>
      <Button onClick={() => navigate('/system')} sx={{ ml: 2 }}>
        Back to System
      </Button>
    </Box>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/volunteer-registration"
        element={
          <FestivalProvider>
            <VolunteerRegistration />
          </FestivalProvider>
        }
      />
      <Route
        path="/contract/:token"
        element={<ContractSigning />}
      />
      <Route
        path="/"
        element={
          user ? <Navigate to="/system" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/system"
        element={
          user ? (
            <FestivalProvider>
              <ProtectedLayout>
                <SystemDashboard />
              </ProtectedLayout>
            </FestivalProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/events"
        element={
          user ? <EventSelection /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/event/:eventId/dashboard"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/artists"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Artists />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/schedule"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Schedule />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/venues"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Venues />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/venue-locations"
        element={
          user ? (
            <FestivalProvider>
              <ProtectedLayout>
                <VenueLocations />
              </ProtectedLayout>
            </FestivalProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/event/:eventId/volunteers"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Volunteers />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/vendors"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Vendors />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/documents"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Documents />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/budget"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Budget />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/festivals"
        element={
          user ? (
            <FestivalProvider>
              <ProtectedLayout>
                <Festivals />
              </ProtectedLayout>
            </FestivalProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/event/:eventId/ticketing"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Ticketing />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/reports"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Reports />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/settings"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/timetable"
        element={
          <EventGuard>
            <ProtectedLayout>
              <Timetable />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      <Route
        path="/event/:eventId/contracts"
        element={
          <EventGuard>
            <ProtectedLayout>
              <ContractDashboard />
            </ProtectedLayout>
          </EventGuard>
        }
      />
      {user?.role === 'admin' && (
        <Route
          path="/users"
          element={
            <FestivalProvider>
              <ProtectedLayout>
                <Users />
              </ProtectedLayout>
            </FestivalProvider>
          }
        />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
