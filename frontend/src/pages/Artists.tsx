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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  GetApp,
  Person,
  Schedule,
  Assignment,
  Send,
  Visibility,
  CheckCircle,
  PendingActions,
  Block,
  Refresh,
  EditNote,
  MoreVert,
  Link,
  Description,
} from '@mui/icons-material';
import googleSheetsService from '../services/googleSheetsService';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface Artist {
  id: number;
  festival_id: number;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  rider_requirements: string;
  technical_requirements: string;
  fee: number;
  travel_requirements: string;
  accommodation_requirements: string;
  status: 'inquired' | 'confirmed' | 'contracted' | 'cancelled';
}

interface ContractTemplate {
  id: number;
  festival_id: number;
  name: string;
  description: string;
  content: string;
  is_default: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
}

interface ArtistContract {
  id: number;
  artist_id: number;
  template_id: number;
  template_name: string;
  custom_content: string;
  secure_token: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'void';
  deadline: string;
  sent_at: string;
  viewed_at: string;
  signed_at: string;
  created_at: string;
  first_name: string;
  last_name: string;
}

interface Performance {
  id: number;
  artist_id: number;
  stage_area_name: string;
  performance_date: string;
  start_time: string;
  duration_minutes: number;
}

const Artists: React.FC = () => {
  const { currentFestival } = useFestival();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [artistContracts, setArtistContracts] = useState<{[key: number]: ArtistContract[]}>({});
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [amendDialogOpen, setAmendDialogOpen] = useState(false);
  const [amendingContract, setAmendingContract] = useState<ArtistContract | null>(null);
  const [contractMenuAnchor, setContractMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedContractForMenu, setSelectedContractForMenu] = useState<ArtistContract | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contractFormData, setContractFormData] = useState({
    template_id: '',
    custom_content: '',
    deadline: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    rider_requirements: '',
    technical_requirements: '',
    fee: '',
    travel_requirements: '',
    accommodation_requirements: '',
    status: 'inquired' as 'inquired' | 'confirmed' | 'contracted' | 'cancelled',
  });

  useEffect(() => {
    if (currentFestival) {
      fetchArtists();
      fetchPerformances();
      fetchContractTemplates();
    }
  }, [currentFestival]);

  const fetchArtists = async () => {
    if (!currentFestival) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/artists?festival_id=${currentFestival.id}`);
      setArtists(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch artists');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformances = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/schedule?festival_id=${currentFestival.id}`);
      setPerformances(response.data);
    } catch (error) {
      console.error('Failed to fetch performances:', error);
    }
  };

  const fetchContractTemplates = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/contracts/templates?festival_id=${currentFestival.id}`);
      setContractTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch contract templates:', error);
    }
  };

  const fetchArtistContracts = async (artistId: number) => {
    try {
      const response = await axios.get(`/api/contracts/artist/${artistId}`);
      setArtistContracts(prev => ({
        ...prev,
        [artistId]: response.data
      }));
    } catch (error) {
      console.error('Failed to fetch artist contracts:', error);
    }
  };

  const getArtistPerformances = (artistId: number) => {
    return performances.filter(p => p.artist_id === artistId);
  };

  const handleDeletePerformance = async (performanceId: number) => {
    if (!window.confirm('Are you sure you want to delete this performance?')) {
      return;
    }

    try {
      console.log('Deleting performance with ID:', performanceId);
      const response = await axios.delete(`/api/schedule/performance/${performanceId}`);
      console.log('Delete response:', response);
      
      // Refresh performances after deletion
      await fetchPerformances();
      setError('');
      alert('Performance deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete performance:', error);
      setError(`Failed to delete performance: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setDetailOpen(true);
    fetchArtistContracts(artist.id);
  };

  const handleCreateContract = (artist: Artist) => {
    // Check if artist is confirmed before creating contract
    if (artist.status === 'inquired') {
      setError('Artist must be confirmed before creating a contract. Please update their booking status to "Confirmed" first.');
      return;
    }

    setSelectedArtist(artist);
    setContractFormData({
      template_id: contractTemplates.find(t => t.is_default)?.id.toString() || '',
      custom_content: '',
      deadline: '',
    });
    setContractDialogOpen(true);
  };

  const handleContractSubmit = async () => {
    if (!selectedArtist || !contractFormData.template_id) {
      setError('Please select a contract template');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/contracts/artist/${selectedArtist.id}`, {
        template_id: parseInt(contractFormData.template_id),
        custom_content: contractFormData.custom_content || null,
        deadline: contractFormData.deadline || null,
      });

      // Refresh artist contracts
      fetchArtistContracts(selectedArtist.id);
      setContractDialogOpen(false);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSendContract = async (artistId: number, contractId: number) => {
    // Check if artist is confirmed before sending contract
    const artist = artists.find(a => a.id === artistId);
    if (artist && artist.status === 'inquired') {
      setError('Artist must be confirmed before sending a contract. Please update their booking status to "Confirmed" first.');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/contracts/artist/${artistId}/${contractId}/send`);
      fetchArtistContracts(artistId);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send contract');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidContract = async (artistId: number, contractId: number) => {
    if (!window.confirm('Are you sure you want to void this contract? This will revert the artist status to "Confirmed".')) {
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/contracts/artist/${artistId}/${contractId}/void`);
      fetchArtistContracts(artistId);
      fetchArtists(); // Refresh to update artist status
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to void contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (artistId: number, contractId: number) => {
    if (!window.confirm('Are you sure you want to delete this contract? This action cannot be undone and will revert the artist status to "Confirmed".')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/contracts/artist/${artistId}/${contractId}`);
      fetchArtistContracts(artistId);
      fetchArtists(); // Refresh to update artist status
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete contract');
    } finally {
      setLoading(false);
    }
  };

  const handleResendContract = async (artistId: number, contractId: number) => {
    setLoading(true);
    try {
      await axios.put(`/api/contracts/artist/${artistId}/${contractId}/resend`);
      fetchArtistContracts(artistId);
      setError('');
      alert('Contract resent successfully! A new link has been generated.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to resend contract');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAmendDialog = (contract: ArtistContract) => {
    setAmendingContract(contract);
    setContractFormData({
      template_id: contract.template_id.toString(),
      custom_content: contract.custom_content || '',
      deadline: contract.deadline || '',
    });
    setAmendDialogOpen(true);
  };

  const handleAmendContract = async () => {
    if (!amendingContract || !selectedArtist) return;

    setLoading(true);
    try {
      // If amending a signed contract, void the existing one and create new
      if (amendingContract.status === 'signed') {
        await axios.put(`/api/contracts/artist/${selectedArtist.id}/${amendingContract.id}/void`);
        
        // Create new contract with amended content
        await axios.post(`/api/contracts/artist/${selectedArtist.id}`, {
          template_id: parseInt(contractFormData.template_id),
          custom_content: contractFormData.custom_content || null,
          deadline: contractFormData.deadline || null,
        });
        
        fetchArtists(); // Refresh to update artist status
      } else {
        // Just amend the existing contract
        await axios.put(`/api/contracts/artist/${selectedArtist.id}/${amendingContract.id}/amend`, {
          custom_content: contractFormData.custom_content || null,
          deadline: contractFormData.deadline || null,
        });
      }
      
      fetchArtistContracts(selectedArtist.id);
      setAmendDialogOpen(false);
      setAmendingContract(null);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to amend contract');
    } finally {
      setLoading(false);
    }
  };

  const handleContractMenuClick = (event: React.MouseEvent<HTMLElement>, contract: ArtistContract) => {
    setContractMenuAnchor(event.currentTarget);
    setSelectedContractForMenu(contract);
  };

  const handleContractMenuClose = () => {
    setContractMenuAnchor(null);
    setSelectedContractForMenu(null);
  };

  const handleShowSignedContract = (token: string) => {
    window.open(`/contract/${token}`, '_blank');
    handleContractMenuClose();
  };

  const getContractLink = (token: string) => {
    return `${window.location.origin}/contract/${token}`;
  };

  const copyContractLink = (token: string) => {
    const link = getContractLink(token);
    navigator.clipboard.writeText(link);
    alert('Contract link copied to clipboard!');
  };

  const handleOpen = (artist?: Artist) => {
    if (artist) {
      setEditingArtist(artist);
      setFormData({
        name: artist.name,
        contact_name: artist.contact_name || '',
        contact_email: artist.contact_email || '',
        contact_phone: artist.contact_phone || '',
        rider_requirements: artist.rider_requirements || '',
        technical_requirements: artist.technical_requirements || '',
        fee: artist.fee?.toString() || '',
        travel_requirements: artist.travel_requirements || '',
        accommodation_requirements: artist.accommodation_requirements || '',
        status: artist.status,
      });
    } else {
      setEditingArtist(null);
      setFormData({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        rider_requirements: '',
        technical_requirements: '',
        fee: '',
        travel_requirements: '',
        accommodation_requirements: '',
        status: 'inquired',
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingArtist(null);
    setError('');
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      setError('Artist name is required');
      return;
    }

    if (formData.contact_email && !formData.contact_email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.contact_phone && formData.contact_phone.length < 10) {
      setError('Please enter a valid phone number (minimum 10 digits)');
      return;
    }

    if (formData.fee && isNaN(parseFloat(formData.fee))) {
      setError('Fee must be a valid number');
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
        fee: formData.fee ? parseFloat(formData.fee) : null,
      };

      if (editingArtist) {
        await axios.put(`/api/artists/${editingArtist.id}`, data);
      } else {
        await axios.post('/api/artists', data);
      }

      fetchArtists();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save artist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this artist?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/artists/${id}`);
        fetchArtists();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete artist');
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'contracted':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'success';
      case 'viewed':
        return 'info';
      case 'sent':
        return 'warning';
      case 'draft':
        return 'default';
      case 'expired':
        return 'error';
      case 'void':
        return 'error';
      default:
        return 'default';
    }
  };

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle />;
      case 'viewed':
        return <Visibility />;
      case 'sent':
        return <Send />;
      case 'draft':
        return <Assignment />;
      case 'expired':
        return <Delete />;
      case 'void':
        return <Delete />;
      default:
        return <PendingActions />;
    }
  };

  const getLatestContract = (artistId: number): ArtistContract | null => {
    const contracts = artistContracts[artistId];
    if (!contracts || contracts.length === 0) return null;
    return contracts[0]; // Already sorted by created_at DESC from backend
  };


  const exportArtists = async () => {
    try {
      if (googleSheetsService.isConfigured() && googleSheetsService.isAuthenticated()) {
        const success = await googleSheetsService.exportArtists(artists);
        if (success) {
          alert('Artists exported to Google Sheets successfully!');
        } else {
          setError('Failed to export artists to Google Sheets');
        }
      } else {
        // Fallback: CSV export
        const csvContent = [
          'Name,Contact Email,Contact Phone,Performance,Status,Fee',
          ...artists.map(artist => {
            const artistPerformances = getArtistPerformances(artist.id);
            const performanceInfo = artistPerformances.length > 0 ? 
              artistPerformances.map(p => `${p.stage_area_name} - ${p.performance_date} at ${p.start_time}`).join('; ') : 
              'Not scheduled';
            return `"${artist.name}","${artist.contact_email}","${artist.contact_phone}","${performanceInfo}","${artist.status}","${artist.fee}"`;
          })
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'artists.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError('Failed to export artists');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Artists</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={exportArtists}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Add Artist
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Artist Name</TableCell>
              <TableCell align="right">Booking Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {artists.map((artist) => (
              <TableRow 
                key={artist.id} 
                onClick={() => handleArtistClick(artist)}
                sx={{ 
                  cursor: 'pointer', 
                  '&:hover': { backgroundColor: 'grey.50' } 
                }}
              >
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {artist.name}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, px: 3 }}>
                  <Chip
                    label={artist.status}
                    color={getStatusColor(artist.status) as any}
                    size="small"
                    icon={artist.status === 'contracted' ? <CheckCircle /> : undefined}
                  />
                </TableCell>
              </TableRow>
            ))}
            {artists.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  No artists found. Add your first artist to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingArtist ? 'Edit Artist' : 'Add New Artist'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Artist Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Contact Name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
              <TextField
                label="Contact Phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </Box>

            <TextField
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Fee (£)"
                type="number"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              />
              <FormControl required>
                <InputLabel>Booking Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Booking Status"
                >
                  <MenuItem value="inquired">Inquired</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="contracted">Contracted</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Rider Requirements"
              multiline
              rows={3}
              value={formData.rider_requirements}
              onChange={(e) => setFormData({ ...formData, rider_requirements: e.target.value })}
              fullWidth
            />

            <TextField
              label="Technical Requirements"
              multiline
              rows={3}
              value={formData.technical_requirements}
              onChange={(e) => setFormData({ ...formData, technical_requirements: e.target.value })}
              fullWidth
            />

            <TextField
              label="Travel Requirements"
              multiline
              rows={2}
              value={formData.travel_requirements}
              onChange={(e) => setFormData({ ...formData, travel_requirements: e.target.value })}
              fullWidth
            />

            <TextField
              label="Accommodation Requirements"
              multiline
              rows={2}
              value={formData.accommodation_requirements}
              onChange={(e) => setFormData({ ...formData, accommodation_requirements: e.target.value })}
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
            {loading ? 'Saving...' : editingArtist ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Artist Detail View Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            {selectedArtist?.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => {
                if (selectedArtist) {
                  setDetailOpen(false);
                  handleOpen(selectedArtist);
                }
              }}
            >
              Edit Artist
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => {
                if (selectedArtist) {
                  handleDelete(selectedArtist.id);
                  setDetailOpen(false);
                }
              }}
            >
              Delete Artist
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {selectedArtist && (
            <Box sx={{ display: 'grid', gap: 4 }}>
              {/* Artist Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    Artist Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Booking Status</Typography>
                      <Chip
                        label={selectedArtist.status}
                        color={getStatusColor(selectedArtist.status) as any}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Contact Name</Typography>
                      <Typography variant="body1">{selectedArtist.contact_name || 'Not provided'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{selectedArtist.contact_email || 'Not provided'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{selectedArtist.contact_phone || 'Not provided'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Fee</Typography>
                      <Typography variant="body1">
                        {selectedArtist.fee ? `£${selectedArtist.fee.toLocaleString()}` : 'TBD'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {selectedArtist.rider_requirements && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">Rider Requirements</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {selectedArtist.rider_requirements}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedArtist.technical_requirements && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Technical Requirements</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {selectedArtist.technical_requirements}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Performance Schedule */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule />
                    Performance Schedule
                  </Typography>
                  {(() => {
                    const artistPerformances = getArtistPerformances(selectedArtist.id);
                    if (artistPerformances.length > 0) {
                      return (
                        <Box sx={{ mt: 2 }}>
                          {artistPerformances.map((performance, index) => (
                            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                              <CardContent sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                      {performance.stage_area_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {performance.performance_date} at {performance.start_time}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Duration: {performance.duration_minutes} minutes
                                    </Typography>
                                  </Box>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => handleDeletePerformance(performance.id)}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      );
                    }
                    return (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <Typography variant="body1">No performances scheduled</Typography>
                        <Button
                          variant="outlined"
                          sx={{ mt: 2 }}
                          onClick={() => {
                            // TODO: Add create performance functionality
                            console.log('Add performance for artist:', selectedArtist.id);
                          }}
                        >
                          Schedule Performance
                        </Button>
                      </Box>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Contract Management */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Contract Management
                  </Typography>
                  {(() => {
                    const contracts = artistContracts[selectedArtist.id] || [];
                    if (contracts.length > 0) {
                      return (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                              variant="outlined"
                              startIcon={<Add />}
                              onClick={() => handleCreateContract(selectedArtist)}
                            >
                              New Contract
                            </Button>
                          </Box>
                          {contracts.map((contract, index) => (
                            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                              <CardContent sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                      {contract.template_name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                      <Chip
                                        label={contract.status}
                                        color={getContractStatusColor(contract.status) as any}
                                        size="small"
                                        icon={getContractStatusIcon(contract.status)}
                                      />
                                      {contract.deadline && (
                                        <Typography variant="caption" color="text.secondary">
                                          Deadline: {new Date(contract.deadline).toLocaleDateString()}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                      Created: {new Date(contract.created_at).toLocaleDateString()} by {contract.first_name} {contract.last_name}
                                    </Typography>
                                    {contract.signed_at && (
                                      <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                        Signed: {new Date(contract.signed_at).toLocaleDateString()}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                                    {contract.status === 'draft' && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<Send />}
                                        onClick={() => handleSendContract(selectedArtist.id, contract.id)}
                                      >
                                        Send
                                      </Button>
                                    )}
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<MoreVert />}
                                      onClick={(e) => handleContractMenuClick(e, contract)}
                                    >
                                      Actions
                                    </Button>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      );
                    }
                    return (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <Assignment sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1" sx={{ mb: 2 }}>No contracts created</Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleCreateContract(selectedArtist)}
                        >
                          Create Contract
                        </Button>
                      </Box>
                    );
                  })()}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Contract Creation Dialog */}
      <Dialog open={contractDialogOpen} onClose={() => setContractDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create Contract for {selectedArtist?.name}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <FormControl required>
              <InputLabel>Contract Template</InputLabel>
              <Select
                value={contractFormData.template_id}
                onChange={(e) => setContractFormData({ ...contractFormData, template_id: e.target.value })}
                label="Contract Template"
              >
                {contractTemplates.map((template) => (
                  <MenuItem key={template.id} value={template.id.toString()}>
                    <Box>
                      <Typography variant="body2">{template.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.description}
                      </Typography>
                      {template.is_default && (
                        <Chip label="Default" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Custom Content (Optional)"
              multiline
              rows={8}
              value={contractFormData.custom_content}
              onChange={(e) => setContractFormData({ ...contractFormData, custom_content: e.target.value })}
              placeholder="Leave blank to use template content, or add custom content here..."
              helperText="You can use placeholders like {{artist_name}}, {{festival_name}}, {{current_date}}, etc."
              fullWidth
            />

            <TextField
              label="Deadline (Optional)"
              type="date"
              value={contractFormData.deadline}
              onChange={(e) => setContractFormData({ ...contractFormData, deadline: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Leave blank for no deadline"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleContractSubmit}
            disabled={loading || !contractFormData.template_id}
          >
            {loading ? 'Creating...' : 'Create Contract'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contract Amendment Dialog */}
      <Dialog open={amendDialogOpen} onClose={() => setAmendDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Amend Contract for {selectedArtist?.name}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Custom Content"
              multiline
              rows={8}
              value={contractFormData.custom_content}
              onChange={(e) => setContractFormData({ ...contractFormData, custom_content: e.target.value })}
              placeholder="Enter updated contract content here..."
              helperText="You can use placeholders like {{artist_name}}, {{festival_name}}, {{current_date}}, etc."
              fullWidth
            />

            <TextField
              label="Deadline"
              type="date"
              value={contractFormData.deadline}
              onChange={(e) => setContractFormData({ ...contractFormData, deadline: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Leave blank for no deadline"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAmendDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAmendContract}
            disabled={loading}
          >
            {loading ? 'Amending...' : 'Amend Contract'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contract Actions Menu */}
      <Menu
        anchorEl={contractMenuAnchor}
        open={Boolean(contractMenuAnchor)}
        onClose={handleContractMenuClose}
      >
        {selectedContractForMenu && (
          <>
            <MenuItem onClick={() => {
              copyContractLink(selectedContractForMenu.secure_token);
              handleContractMenuClose();
            }}>
              <ListItemIcon>
                <Link />
              </ListItemIcon>
              <ListItemText>Contract Link</ListItemText>
            </MenuItem>
            
            {selectedContractForMenu.status === 'signed' && (
              <MenuItem onClick={() => handleShowSignedContract(selectedContractForMenu.secure_token)}>
                <ListItemIcon>
                  <Description />
                </ListItemIcon>
                <ListItemText>Show Signed Contract</ListItemText>
              </MenuItem>
            )}
            
            {(selectedContractForMenu.status === 'sent' || selectedContractForMenu.status === 'viewed') && (
              <MenuItem onClick={() => {
                if (selectedArtist) {
                  handleResendContract(selectedArtist.id, selectedContractForMenu.id);
                }
                handleContractMenuClose();
              }}>
                <ListItemIcon>
                  <Refresh />
                </ListItemIcon>
                <ListItemText>Resend</ListItemText>
              </MenuItem>
            )}
            
            <MenuItem onClick={() => {
              handleOpenAmendDialog(selectedContractForMenu);
              handleContractMenuClose();
            }}>
              <ListItemIcon>
                <EditNote />
              </ListItemIcon>
              <ListItemText>
                Amend {selectedContractForMenu.status === 'signed' ? '(Voids Current)' : ''}
              </ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              if (selectedArtist) {
                handleVoidContract(selectedArtist.id, selectedContractForMenu.id);
              }
              handleContractMenuClose();
            }}>
              <ListItemIcon>
                <Block />
              </ListItemIcon>
              <ListItemText>Void Contract</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              if (selectedArtist) {
                handleDeleteContract(selectedArtist.id, selectedContractForMenu.id);
              }
              handleContractMenuClose();
            }}>
              <ListItemIcon>
                <Delete />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default Artists;