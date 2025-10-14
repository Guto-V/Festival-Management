import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
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
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Event,
  ContentCopy,
  Launch,
  Edit,
  Delete,
  Group,
  Schedule,
  AccountBalance,
  People,
  Business,
} from '@mui/icons-material';
import { useFestival } from '../contexts/FestivalContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface CloneOptions {
  artists: boolean;
  venues: boolean;
  volunteers: boolean;
  vendors: boolean;
  schedule: boolean;
  budget: boolean;
  documents: boolean;
  users: boolean;
}

const FestivalSelection: React.FC = () => {
  const { festivals, currentFestival, setCurrentFestival, refreshFestivals } = useFestival();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [selectedFestivalToClone, setSelectedFestivalToClone] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cloneOptions, setCloneOptions] = useState<CloneOptions>({
    artists: true,
    venues: true,
    volunteers: false,
    vendors: true,
    schedule: false,
    budget: false,
    documents: false,
    users: false,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    status: 'planning' as 'planning' | 'active' | 'completed' | 'cancelled',
    year: new Date().getFullYear(),
    budget_total: 0
  });

  useEffect(() => {
    refreshFestivals();
  }, [refreshFestivals]);

  const handleSelectFestival = (festivalId: number) => {
    const festival = festivals.find(f => f.id === festivalId);
    if (festival) {
      setCurrentFestival(festival);
      navigate('/');
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Festival name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/festivals', formData);
      const newFestival = response.data;
      
      // If cloning, also copy selected data
      if (selectedFestivalToClone) {
        await handleCloneData(selectedFestivalToClone, newFestival.id);
      }
      
      await refreshFestivals();
      setCurrentFestival(newFestival);
      setOpen(false);
      setCloneDialogOpen(false);
      resetForm();
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create festival');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneData = async (sourceId: number, targetId: number) => {
    try {
      const clonePromises = [];
      
      if (cloneOptions.artists) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/artists`, { sourceId }));
      }
      if (cloneOptions.venues) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/venues`, { sourceId }));
      }
      if (cloneOptions.volunteers) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/volunteers`, { sourceId }));
      }
      if (cloneOptions.vendors) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/vendors`, { sourceId }));
      }
      if (cloneOptions.schedule) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/schedule`, { sourceId }));
      }
      if (cloneOptions.budget) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/budget`, { sourceId }));
      }
      if (cloneOptions.documents) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/documents`, { sourceId }));
      }
      if (cloneOptions.users) {
        clonePromises.push(axios.post(`/festivals/${targetId}/clone/users`, { sourceId }));
      }

      await Promise.all(clonePromises);
    } catch (error: any) {
      console.error('Failed to clone data:', error);
      setError('Festival created but some data failed to clone');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      status: 'planning',
      year: new Date().getFullYear(),
      budget_total: 0
    });
    setSelectedFestivalToClone(null);
    setCloneOptions({
      artists: true,
      venues: true,
      volunteers: false,
      vendors: true,
      schedule: false,
      budget: false,
      documents: false,
      users: false,
    });
    setError('');
  };

  const handleOpenCloneDialog = () => {
    setCloneDialogOpen(true);
    setOpen(false);
  };

  const handleCloneOptionChange = (option: keyof CloneOptions) => {
    setCloneOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'planning':
        return 'primary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Event sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" gutterBottom>
            Festival Management System
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Select an existing festival or create a new one to get started
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
          >
            Create New Festival
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ContentCopy />}
            onClick={handleOpenCloneDialog}
            disabled={festivals.length === 0}
          >
            Clone Existing Festival
          </Button>
        </Box>

        {/* Festival Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3 
        }}>
          {festivals.map((festival) => (
            <Card 
              key={festival.id} 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => handleSelectFestival(festival.id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    {festival.name}
                  </Typography>
                  <Chip 
                    label={festival.status} 
                    size="small" 
                    color={getStatusColor(festival.status) as any}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {festival.description || 'No description provided'}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    📅 {formatDate(festival.start_date)} - {formatDate(festival.end_date)}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    📍 {festival.location}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    💰 Budget: £{festival.budget_total.toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<Group />} label="Team" size="small" variant="outlined" />
                  <Chip icon={<Schedule />} label="Schedule" size="small" variant="outlined" />
                  <Chip icon={<AccountBalance />} label="Budget" size="small" variant="outlined" />
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    endIcon={<Launch />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectFestival(festival.id);
                    }}
                  >
                    Open Dashboard
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {festivals.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No festivals found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first festival to get started with the management system
            </Typography>
          </Box>
        )}

        {/* Create Festival Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Festival</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Festival Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
              />
              
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={3}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                fullWidth
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                />
                
                <TextField
                  label="Total Budget (£)"
                  type="number"
                  value={formData.budget_total}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget_total: parseFloat(e.target.value) || 0 }))}
                />
              </Box>

              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  label="Status"
                >
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={loading}>
              {loading ? 'Creating...' : 'Create Festival'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Clone Festival Dialog */}
        <Dialog open={cloneDialogOpen} onClose={() => setCloneDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Clone Festival</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Select Festival to Clone</InputLabel>
                <Select
                  value={selectedFestivalToClone || ''}
                  onChange={(e) => setSelectedFestivalToClone(e.target.value as number)}
                  label="Select Festival to Clone"
                >
                  {festivals.map((festival) => (
                    <MenuItem key={festival.id} value={festival.id}>
                      {festival.name} ({festival.year})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              <Typography variant="h6">New Festival Details</Typography>
              
              <TextField
                label="Festival Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
              />
              
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Divider />
              
              <Typography variant="h6">What to Clone</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which data you want to copy from the source festival
              </Typography>
              
              <FormGroup>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.artists} onChange={() => handleCloneOptionChange('artists')} />}
                    label="Artists & Performers"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.venues} onChange={() => handleCloneOptionChange('venues')} />}
                    label="Venues & Stages"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.vendors} onChange={() => handleCloneOptionChange('vendors')} />}
                    label="Vendors & Suppliers"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.volunteers} onChange={() => handleCloneOptionChange('volunteers')} />}
                    label="Volunteers"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.schedule} onChange={() => handleCloneOptionChange('schedule')} />}
                    label="Performance Schedule"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.budget} onChange={() => handleCloneOptionChange('budget')} />}
                    label="Budget Templates"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.documents} onChange={() => handleCloneOptionChange('documents')} />}
                    label="Document Templates"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={cloneOptions.users} onChange={() => handleCloneOptionChange('users')} />}
                    label="User Permissions"
                  />
                </Box>
              </FormGroup>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCloneDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreate} 
              variant="contained" 
              disabled={loading || !selectedFestivalToClone || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Clone Festival'}
            </Button>
          </DialogActions>
        </Dialog>

        {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0 }} />}
      </Box>
    </Box>
  );
};

export default FestivalSelection;