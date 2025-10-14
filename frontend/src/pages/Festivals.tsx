import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Event,
  FileCopy,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Assessment,
  People,
  Place,
  AttachMoney,
  Schedule,
  Business,
  VolunteerActivism,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

// Set dayjs to use UK locale
dayjs.locale('en-gb');

interface Festival {
  id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  venue_id?: number;
  location?: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  budget_total: number;
  budget_allocated: number;
  created_at: string;
  updated_at: string;
}

interface VenueLocation {
  id: number;
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  capacity?: number;
  description?: string;
}

const Festivals: React.FC = () => {
  const {
    festivals,
    festivalStats,
    currentFestival,
    loading,
    error,
    refreshFestivals,
    createFestival,
    updateFestival,
    deleteFestival,
    cloneFestival,
  } = useFestival();

  const [open, setOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [cloneFestivalId, setCloneFestivalId] = useState<number | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [venueLocations, setVenueLocations] = useState<VenueLocation[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    start_date: dayjs() as Dayjs | null,
    end_date: dayjs() as Dayjs | null,
    venue_id: '',
    location: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'completed' | 'cancelled',
    budget_total: '',
    is_multi_day: false,
  });

  const [cloneData, setCloneData] = useState({
    name: '',
    start_date: dayjs() as Dayjs | null,
    end_date: dayjs() as Dayjs | null,
  });

  const statusColors = {
    planning: 'primary',
    active: 'success',
    completed: 'default',
    cancelled: 'error'
  } as const;

  const statusIcons = {
    planning: '📋',
    active: '🎪',
    completed: '✅',
    cancelled: '❌'
  };

  useEffect(() => {
    refreshFestivals();
    fetchVenueLocations();
  }, []);

  const fetchVenueLocations = async () => {
    try {
      const response = await axios.get('/api/venue-locations');
      setVenueLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch venue locations:', error);
    }
  };

  const handleOpen = (festival?: Festival) => {
    if (festival) {
      setEditingFestival(festival);
      const startDate = dayjs(festival.start_date);
      const endDate = dayjs(festival.end_date);
      const isMultiDay = !startDate.isSame(endDate, 'day');
      
      setFormData({
        name: festival.name,
        start_date: startDate,
        end_date: endDate,
        venue_id: festival.venue_id?.toString() || '',
        location: festival.location || '',
        description: festival.description || '',
        status: festival.status,
        budget_total: festival.budget_total.toString(),
        is_multi_day: isMultiDay,
      });
    } else {
      setEditingFestival(null);
      setFormData({
        name: '',
        start_date: dayjs(),
        end_date: dayjs(),
        venue_id: '',
        location: '',
        description: '',
        status: 'planning',
        budget_total: '0',
        is_multi_day: false,
      });
    }
    setOpen(true);
    setLocalError('');
  };

  const handleClose = () => {
    setOpen(false);
    setCloneDialogOpen(false);
    setEditingFestival(null);
    setCloneFestivalId(null);
    setLocalError('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.start_date || !formData.venue_id) {
      setLocalError('Event name, date, and venue location are required');
      return;
    }

    // Set end_date to start_date if it's a single day event
    const endDate = formData.is_multi_day ? formData.end_date : formData.start_date;
    
    if (!endDate) {
      setLocalError('End date is required for multi-day events');
      return;
    }

    if (formData.is_multi_day && endDate.isBefore(formData.start_date)) {
      setLocalError('End date must be after start date');
      return;
    }

    setSubmitLoading(true);
    try {
      const year = formData.start_date.year();
      const data = {
        name: formData.name,
        year: year,
        start_date: formData.start_date.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        venue_id: formData.venue_id ? parseInt(formData.venue_id) : null,
        location: formData.location,
        description: formData.description,
        status: formData.status,
        budget_total: parseFloat(formData.budget_total) || 0,
      };

      if (editingFestival) {
        await updateFestival(editingFestival.id, data);
      } else {
        await createFestival(data);
      }

      handleClose();
    } catch (error: any) {
      setLocalError(error.response?.data?.error || 'Failed to save festival');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClone = async () => {
    if (!cloneData.name.trim() || !cloneData.start_date || !cloneData.end_date || !cloneFestivalId) {
      setLocalError('All fields are required for cloning');
      return;
    }

    if (cloneData.end_date.isBefore(cloneData.start_date)) {
      setLocalError('End date must be after start date');
      return;
    }

    setSubmitLoading(true);
    try {
      const year = cloneData.start_date.year();
      const data = {
        name: cloneData.name,
        year: year,
        start_date: cloneData.start_date.format('YYYY-MM-DD'),
        end_date: cloneData.end_date.format('YYYY-MM-DD'),
      };

      await cloneFestival(cloneFestivalId, data);
      handleClose();
    } catch (error: any) {
      setLocalError(error.response?.data?.error || 'Failed to clone festival');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (festival: Festival) => {
    if (window.confirm(`Are you sure you want to delete "${festival.name} ${festival.year}"?`)) {
      try {
        await deleteFestival(festival.id);
        handleActionMenuClose();
      } catch (error: any) {
        // Check if this is a "can force delete" error
        if (error.canForceDelete) {
          const details = error.details;
          const itemsList = Object.entries(details)
            .filter(([key, count]) => (count as number) > 0)
            .map(([key, count]) => `${count as number} ${key.replace('_', ' ')}`)
            .join(', ');
          
          const forceDelete = window.confirm(
            `This festival has associated data: ${itemsList}.\n\n` +
            `Do you want to permanently delete the festival and ALL associated data?\n\n` +
            `This action cannot be undone.`
          );
          
          if (forceDelete) {
            try {
              await deleteFestival(festival.id, true); // Force delete
              handleActionMenuClose();
            } catch (forceError: any) {
              setLocalError(forceError.response?.data?.error || 'Failed to force delete festival');
            }
          }
        } else {
          setLocalError(error.message || 'Failed to delete festival');
        }
      }
    }
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, festival: Festival) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedFestival(festival);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedFestival(null);
  };

  const handleCloneDialogOpen = (festival: Festival) => {
    setCloneFestivalId(festival.id);
    setCloneData({
      name: `${festival.name} ${festival.year + 1}`,
      start_date: dayjs(festival.start_date).add(1, 'year'),
      end_date: dayjs(festival.end_date).add(1, 'year'),
    });
    setCloneDialogOpen(true);
    handleActionMenuClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const handleOpenEventDashboard = (eventId: number) => {
    window.location.href = `/event/${eventId}/dashboard`;
  };

  const getFestivalStats = () => {
    return {
      total: festivals.length,
      planning: festivals.filter(f => f.status === 'planning').length,
      active: festivals.filter(f => f.status === 'active').length,
      completed: festivals.filter(f => f.status === 'completed').length,
      cancelled: festivals.filter(f => f.status === 'cancelled').length,
      totalBudget: festivals.reduce((sum, f) => sum + f.budget_total, 0),
    };
  };

  const stats = getFestivalStats();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Event Management</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Create Event
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 3, mb: 4 }}>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: 'center', height: 140, py: 2 }}>
                <Event sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                <Typography variant="h4">{stats.total}</Typography>
                <Typography variant="body2" color="textSecondary">Total Events</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" color="primary">{stats.planning}</Typography>
                <Typography variant="body2">Planning</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" color="success.main">{stats.active}</Typography>
                <Typography variant="body2">Active</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" color="textSecondary">{stats.completed}</Typography>
                <Typography variant="body2">Completed</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" color="primary">{formatCurrency(stats.totalBudget)}</Typography>
                <Typography variant="body2">Total Budget</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Current Festival Stats */}
        {currentFestival && festivalStats && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {currentFestival.name} {currentFestival.year} - Current Event Statistics
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' }, gap: 3 }}>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Place color="primary" />
                    <Typography variant="h6">{festivalStats.venues}</Typography>
                    <Typography variant="caption">Venues</Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Schedule color="primary" />
                    <Typography variant="h6">{festivalStats.performances}</Typography>
                    <Typography variant="caption">Performances</Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <People color="primary" />
                    <Typography variant="h6">{festivalStats.artists}</Typography>
                    <Typography variant="caption">Artists</Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <VolunteerActivism color="primary" />
                    <Typography variant="h6">{festivalStats.volunteers}</Typography>
                    <Typography variant="caption">Volunteers</Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Business color="primary" />
                    <Typography variant="h6">{festivalStats.vendors}</Typography>
                    <Typography variant="caption">Vendors</Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <AttachMoney color={festivalStats.net_profit >= 0 ? 'success' : 'error'} />
                    <Typography 
                      variant="h6" 
                      color={festivalStats.net_profit >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(festivalStats.net_profit)}
                    </Typography>
                    <Typography variant="caption">Net Profit</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {(error || localError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || localError}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {festivals.map((festival) => (
                <TableRow 
                  key={festival.id} 
                  hover
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{statusIcons[festival.status]}</span>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {festival.name}
                        </Typography>
                        {festival.description && (
                          <Typography variant="caption" color="textSecondary">
                            {festival.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {festival.year}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(festival.start_date)} - {formatDate(festival.end_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {festival.location || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={festival.status}
                      size="small"
                      color={statusColors[festival.status]}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(festival.budget_total)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenEventDashboard(festival.id)}
                        sx={{ textTransform: 'none' }}
                      >
                        Open Event Dashboard
                      </Button>
                      <IconButton
                        onClick={() => handleOpen(festival)}
                        size="small"
                        title="Edit"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={(e) => handleActionMenuOpen(e, festival)}
                        size="small"
                        title="More actions"
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          <MenuItem onClick={() => selectedFestival && handleCloneDialogOpen(selectedFestival)}>
            <ListItemIcon>
              <FileCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Clone Event</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => selectedFestival && handleDelete(selectedFestival)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Event</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add/Edit Event Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingFestival ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogContent>
            {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
            
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <TextField
                label="Event Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_multi_day}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      is_multi_day: e.target.checked,
                      end_date: e.target.checked ? formData.end_date : formData.start_date
                    })}
                  />
                }
                label="Multi-day event"
              />

              {formData.is_multi_day ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <DatePicker
                    label="Start Date"
                    value={formData.start_date}
                    onChange={(newValue) => setFormData({ ...formData, start_date: newValue })}
                    slotProps={{ textField: { required: true, fullWidth: true } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={formData.end_date}
                    onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                    slotProps={{ textField: { required: true, fullWidth: true } }}
                  />
                </Box>
              ) : (
                <DatePicker
                  label="Event Date"
                  value={formData.start_date}
                  onChange={(newValue) => setFormData({ 
                    ...formData, 
                    start_date: newValue,
                    end_date: newValue
                  })}
                  slotProps={{ textField: { required: true, fullWidth: true } }}
                />
              )}

              <FormControl fullWidth required>
                <InputLabel>Venue Location *</InputLabel>
                <Select
                  value={formData.venue_id}
                  onChange={(e) => setFormData({ ...formData, venue_id: e.target.value as string })}
                  label="Venue Location *"
                  required
                >
                  <MenuItem value="">
                    <em>Select a venue location</em>
                  </MenuItem>
                  {venueLocations.map((venue) => (
                    <MenuItem key={venue.id} value={venue.id.toString()}>
                      {venue.name} - {venue.city}, {venue.country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {venueLocations.length === 0 && (
                <Alert severity="info">
                  No venue locations found.{' '}
                  <Button size="small" onClick={() => window.open('/venue-locations', '_blank')}>
                    Create Venue Location
                  </Button>
                </Alert>
              )}

              <TextField
                label="Additional Location Details"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Room, hall, or specific area within the venue"
                fullWidth
                helperText="Optional: Specify room, hall, or area within the selected venue"
              />

              <TextField
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    label="Status"
                  >
                    <MenuItem value="planning">Planning</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Total Budget"
                  type="number"
                  value={formData.budget_total}
                  onChange={(e) => setFormData({ ...formData, budget_total: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: '£' }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitLoading}
            >
              {submitLoading ? 'Saving...' : editingFestival ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clone Event Dialog */}
        <Dialog open={cloneDialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Clone Event</DialogTitle>
          <DialogContent>
            {localError && <Alert severity="error" sx={{ mb: 2 }}>{localError}</Alert>}
            
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <TextField
                label="New Event Name"
                value={cloneData.name}
                onChange={(e) => setCloneData({ ...cloneData, name: e.target.value })}
                required
                fullWidth
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={cloneData.start_date}
                  onChange={(newValue) => setCloneData({ ...cloneData, start_date: newValue })}
                  slotProps={{ textField: { required: true, fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={cloneData.end_date}
                  onChange={(newValue) => setCloneData({ ...cloneData, end_date: newValue })}
                  slotProps={{ textField: { required: true, fullWidth: true } }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleClone}
              disabled={submitLoading}
            >
              {submitLoading ? 'Cloning...' : 'Clone Event'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Festivals;