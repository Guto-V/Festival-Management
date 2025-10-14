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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  Store,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface Vendor {
  id: number;
  festival_id: number;
  name: string;
  type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  services_offered: string;
  pricing_info: string;
  status: 'inquired' | 'contracted' | 'confirmed' | 'cancelled';
  payment_terms: string;
  insurance_details: string;
  special_requirements: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const Vendors: React.FC = () => {
  const { currentFestival } = useFestival();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [open, setOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    services_offered: '',
    pricing_info: '',
    status: 'inquired' as 'inquired' | 'contracted' | 'confirmed' | 'cancelled',
    payment_terms: '',
    insurance_details: '',
    special_requirements: '',
    notes: '',
  });

  const vendorTypes = [
    'Food & Beverage',
    'Merchandise',
    'Equipment Rental',
    'Security',
    'Cleaning',
    'Transportation',
    'Accommodation',
    'Photography',
    'Marketing',
    'Other'
  ];

  const statusColors = {
    inquired: 'default',
    contracted: 'primary',
    confirmed: 'success',
    cancelled: 'error'
  } as const;

  useEffect(() => {
    if (currentFestival) {
      fetchVendors();
    }
  }, [currentFestival]);

  const fetchVendors = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/vendors?festival_id=${currentFestival.id}`);
      setVendors(response.data);
    } catch (error) {
      setError('Failed to fetch vendors');
    }
  };

  const handleOpen = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        type: vendor.type,
        contact_name: vendor.contact_name,
        contact_email: vendor.contact_email,
        contact_phone: vendor.contact_phone,
        address: vendor.address,
        services_offered: vendor.services_offered,
        pricing_info: vendor.pricing_info,
        status: vendor.status,
        payment_terms: vendor.payment_terms,
        insurance_details: vendor.insurance_details,
        special_requirements: vendor.special_requirements,
        notes: vendor.notes,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        type: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        services_offered: '',
        pricing_info: '',
        status: 'inquired',
        payment_terms: '',
        insurance_details: '',
        special_requirements: '',
        notes: '',
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVendor(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.type) {
      setError('Vendor name and type are required');
      return;
    }

    if (!currentFestival) {
      setError('No festival selected');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        festival_id: currentFestival.id,
      };

      if (editingVendor) {
        await axios.put(`/api/vendors/${editingVendor.id}`, data);
      } else {
        await axios.post('/api/vendors', data);
      }

      fetchVendors();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`/api/vendors/${id}`);
        fetchVendors();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete vendor');
      }
    }
  };

  const getFilteredVendors = () => {
    switch (tabValue) {
      case 0: return vendors; // All
      case 1: return vendors.filter(v => v.status === 'inquired'); // Inquired
      case 2: return vendors.filter(v => v.status === 'contracted'); // Contracted
      case 3: return vendors.filter(v => v.status === 'confirmed'); // Confirmed
      default: return vendors;
    }
  };

  const getVendorStats = () => {
    return {
      total: vendors.length,
      inquired: vendors.filter(v => v.status === 'inquired').length,
      contracted: vendors.filter(v => v.status === 'contracted').length,
      confirmed: vendors.filter(v => v.status === 'confirmed').length,
      cancelled: vendors.filter(v => v.status === 'cancelled').length,
    };
  };

  const stats = getVendorStats();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Vendor Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          disabled={!currentFestival}
        >
          Add Vendor
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr' },
        gap: 2,
        mb: 3 
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2 }}>
            <Store sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="textSecondary">Total Vendors</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="textSecondary">{stats.inquired}</Typography>
            <Typography variant="body2">Inquired</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="primary">{stats.contracted}</Typography>
            <Typography variant="body2">Contracted</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.confirmed}</Typography>
            <Typography variant="body2">Confirmed</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="error.main">{stats.cancelled}</Typography>
            <Typography variant="body2">Cancelled</Typography>
          </CardContent>
        </Card>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Inquired (${stats.inquired})`} />
          <Tab label={`Contracted (${stats.contracted})`} />
          <Tab label={`Confirmed (${stats.confirmed})`} />
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Services</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredVendors().map((vendor) => (
              <TableRow key={vendor.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {vendor.name}
                    </Typography>
                    {vendor.address && (
                      <Typography variant="caption" color="textSecondary">
                        {vendor.address}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={vendor.type} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{vendor.contact_name}</Typography>
                    {vendor.contact_email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="caption">{vendor.contact_email}</Typography>
                      </Box>
                    )}
                    {vendor.contact_phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="caption">{vendor.contact_phone}</Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {vendor.services_offered || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={vendor.status}
                    color={statusColors[vendor.status]}
                    size="small"
                    icon={
                      vendor.status === 'confirmed' ? <CheckCircle /> :
                      vendor.status === 'cancelled' ? <Cancel /> :
                      undefined
                    }
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpen(vendor)}
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(vendor.id)}
                    size="small"
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {getFilteredVendors().length === 0 && currentFestival && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No vendors found. Add your first vendor to get started!
                </TableCell>
              </TableRow>
            )}
            {!currentFestival && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Please select a festival to view vendors.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Vendor Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  {vendorTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                label="Contact Name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                fullWidth
              />
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

            <TextField
              label="Address"
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />

            <TextField
              label="Services Offered"
              multiline
              rows={3}
              value={formData.services_offered}
              onChange={(e) => setFormData({ ...formData, services_offered: e.target.value })}
              fullWidth
              helperText="Describe what services this vendor provides"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Pricing Information"
                multiline
                rows={2}
                value={formData.pricing_info}
                onChange={(e) => setFormData({ ...formData, pricing_info: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="inquired">Inquired</MenuItem>
                  <MenuItem value="contracted">Contracted</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Payment Terms"
              multiline
              rows={2}
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              fullWidth
            />

            <TextField
              label="Insurance Details"
              multiline
              rows={2}
              value={formData.insurance_details}
              onChange={(e) => setFormData({ ...formData, insurance_details: e.target.value })}
              fullWidth
            />

            <TextField
              label="Special Requirements"
              multiline
              rows={2}
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              fullWidth
            />

            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : editingVendor ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vendors;