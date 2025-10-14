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
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { Add, Edit, Delete, Business, Phone, Email } from '@mui/icons-material';
import axios from 'axios';

interface VenueLocation {
  id: number;
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  capacity?: number;
  description?: string;
  facilities?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VenueLocations: React.FC = () => {
  const [venueLocations, setVenueLocations] = useState<VenueLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    capacity: '',
    description: '',
    facilities: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    fetchVenueLocations();
  }, []);

  const fetchVenueLocations = async () => {
    try {
      const response = await axios.get('/api/venue-locations');
      setVenueLocations(response.data);
    } catch (error) {
      setError('Failed to fetch venue locations');
    }
  };

  const handleOpen = (venue?: VenueLocation) => {
    if (venue) {
      setEditingVenue(venue);
      setFormData({
        name: venue.name,
        address: venue.address || '',
        city: venue.city || '',
        postcode: venue.postcode || '',
        country: venue.country,
        capacity: venue.capacity?.toString() || '',
        description: venue.description || '',
        facilities: venue.facilities || '',
        contact_name: venue.contact_name || '',
        contact_email: venue.contact_email || '',
        contact_phone: venue.contact_phone || '',
      });
    } else {
      setEditingVenue(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        postcode: '',
        country: 'United Kingdom',
        capacity: '',
        description: '',
        facilities: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVenue(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.city.trim()) {
      setError('Venue name and city are required');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };

      if (editingVenue) {
        await axios.put(`/api/venue-locations/${editingVenue.id}`, data);
      } else {
        await axios.post('/api/venue-locations', data);
      }

      fetchVenueLocations();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save venue location');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this venue location?')) {
      try {
        await axios.delete(`/api/venue-locations/${id}`);
        fetchVenueLocations();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete venue location');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Venue Locations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Physical venues where events can be hosted
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Venue Location
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2 }}>
            <Business sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h4">{venueLocations.length}</Typography>
            <Typography variant="body2" color="textSecondary">Total Venues</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="success.main">
              {venueLocations.filter(v => v.capacity).length}
            </Typography>
            <Typography variant="body2">With Capacity Info</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="primary">
              {venueLocations.reduce((sum, v) => sum + (v.capacity || 0), 0)}
            </Typography>
            <Typography variant="body2">Total Capacity</Typography>
          </CardContent>
        </Card>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Venue</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {venueLocations.map((venue) => (
              <TableRow key={venue.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {venue.name}
                    </Typography>
                    {venue.description && (
                      <Typography variant="caption" color="textSecondary">
                        {venue.description}
                      </Typography>
                    )}
                    {venue.facilities && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        Facilities: {venue.facilities}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {venue.address && (
                      <Typography variant="body2">{venue.address}</Typography>
                    )}
                    <Typography variant="body2">
                      {venue.city && `${venue.city}, `}{venue.country}
                    </Typography>
                    {venue.postcode && (
                      <Typography variant="caption" color="textSecondary">
                        {venue.postcode}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {venue.capacity ? (
                    <Chip label={`${venue.capacity} people`} size="small" />
                  ) : (
                    <Typography variant="body2" color="textSecondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    {venue.contact_name && (
                      <Typography variant="body2">{venue.contact_name}</Typography>
                    )}
                    {venue.contact_email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email fontSize="small" />
                        <Typography variant="caption">{venue.contact_email}</Typography>
                      </Box>
                    )}
                    {venue.contact_phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone fontSize="small" />
                        <Typography variant="caption">{venue.contact_phone}</Typography>
                      </Box>
                    )}
                    {!venue.contact_name && !venue.contact_email && !venue.contact_phone && (
                      <Typography variant="body2" color="textSecondary">-</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={venue.is_active ? 'Active' : 'Inactive'}
                    color={venue.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(venue)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(venue.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {venueLocations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No venue locations found. Add your first venue location to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingVenue ? 'Edit Venue Location' : 'Add New Venue Location'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
              <TextField
                label="Venue Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                fullWidth
              />
            </Box>

            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2 }}>
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Postcode"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                fullWidth
              />
              <TextField
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                fullWidth
              />
            </Box>

            <TextField
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />

            <TextField
              label="Facilities"
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder="e.g., Parking, WiFi, Sound system, Catering kitchen"
              fullWidth
            />

            <Typography variant="h6" sx={{ mt: 2 }}>Contact Information</Typography>
            
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Contact Name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                fullWidth
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Contact Email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Contact Phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  fullWidth
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingVenue ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VenueLocations;