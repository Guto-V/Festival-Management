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
  Avatar,
  Badge,
  Switch,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  PersonAdd,
  Schedule as ScheduleIcon,
  CheckCircle,
  Cancel,
  Person,
  ThumbUp,
  ThumbDown,
  Settings,
  ExpandMore,
  Visibility,
  VisibilityOff,
  Preview,
} from '@mui/icons-material';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface Volunteer {
  id: number;
  festival_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skills: string;
  availability: string;
  experience: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  volunteer_status: 'applied' | 'approved' | 'confirmed' | 'declined';
  assigned_role: string;
  t_shirt_size: string;
  dietary_requirements: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface VolunteerApplication {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  experience: string;
  availability: string;
  inductionCompleted: boolean;
  status: 'pending' | 'approved' | 'declined';
  submittedAt: string;
}

interface RegistrationConfig {
  // Field Configuration
  fields: {
    firstName: { enabled: boolean; required: boolean };
    lastName: { enabled: boolean; required: boolean };
    email: { enabled: boolean; required: boolean };
    phone: { enabled: boolean; required: boolean };
    address: { enabled: boolean; required: boolean };
    emergencyContact: { enabled: boolean; required: boolean };
    emergencyPhone: { enabled: boolean; required: boolean };
    experience: { enabled: boolean; required: boolean };
    availability: { enabled: boolean; required: boolean };
  };
  // Text Configuration
  welcomeTitle: string;
  welcomeDescription: string;
  confirmationTitle: string;
  confirmationMessage: string;
  // Induction Configuration
  inductionEnabled: boolean;
  inductionTitle: string;
  inductionContent: string;
}

const Volunteers: React.FC = () => {
  const { currentFestival } = useFestival();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [open, setOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationConfig>({
    fields: {
      firstName: { enabled: true, required: true },
      lastName: { enabled: true, required: true },
      email: { enabled: true, required: true },
      phone: { enabled: true, required: true },
      address: { enabled: true, required: false },
      emergencyContact: { enabled: true, required: false },
      emergencyPhone: { enabled: true, required: false },
      experience: { enabled: true, required: false },
      availability: { enabled: true, required: false },
    },
    welcomeTitle: 'Volunteer Registration',
    welcomeDescription: 'Join our team of dedicated volunteers and help make our festival amazing!',
    confirmationTitle: 'Application Submitted!',
    confirmationMessage: 'Thank you for your interest in volunteering with us. Your application has been submitted successfully and is now under review.',
    inductionEnabled: true,
    inductionTitle: 'Volunteer Induction Information',
    inductionContent: 'Welcome to our volunteer program! Please read through the following information carefully...',
  });
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    skills: '',
    availability: '',
    experience: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    volunteer_status: 'applied' as 'applied' | 'approved' | 'confirmed' | 'declined',
    assigned_role: '',
    t_shirt_size: '',
    dietary_requirements: '',
    notes: '',
  });

  const volunteerRoles = [
    'General Assistant',
    'Stage Crew',
    'Security',
    'Catering Assistant',
    'Merchandise',
    'Information Desk',
    'Car Park',
    'Bar Staff',
    'Clean-up Crew',
    'Technical Support',
    'Artist Liaison',
    'Photography',
    'Social Media',
    'First Aid',
    'Children\'s Area',
    'Setup/Breakdown'
  ];

  const tShirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const statusColors = {
    applied: 'default',
    approved: 'primary',
    confirmed: 'success',
    declined: 'error'
  } as const;

  useEffect(() => {
    if (currentFestival) {
      fetchVolunteers();
      fetchApplications();
      loadRegistrationConfig();
    }
  }, [currentFestival]);

  const loadRegistrationConfig = () => {
    try {
      const savedConfig = localStorage.getItem('volunteerRegistrationConfig');
      if (savedConfig) {
        setRegistrationConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Failed to load registration config from localStorage:', error);
    }
  };

  const saveRegistrationConfig = (config: RegistrationConfig) => {
    try {
      localStorage.setItem('volunteerRegistrationConfig', JSON.stringify(config));
      setRegistrationConfig(config);
    } catch (error) {
      console.error('Failed to save registration config to localStorage:', error);
    }
  };

  const fetchVolunteers = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/volunteers?festival_id=${currentFestival.id}`);
      setVolunteers(response.data);
    } catch (error) {
      setError('Failed to fetch volunteers');
    }
  };

  const fetchApplications = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/volunteer-applications?festival_id=${currentFestival.id}`);
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch volunteer applications:', error);
    }
  };

  const handleApproveApplication = async (applicationId: number) => {
    try {
      await axios.put(`/api/volunteer-applications/${applicationId}/approve`);
      await fetchApplications();
      await fetchVolunteers(); // Refresh volunteers in case the application was converted
    } catch (error) {
      setError('Failed to approve application');
    }
  };

  const handleDeclineApplication = async (applicationId: number) => {
    try {
      await axios.put(`/api/volunteer-applications/${applicationId}/decline`);
      await fetchApplications();
    } catch (error) {
      setError('Failed to decline application');
    }
  };

  const handleOpen = (volunteer?: Volunteer) => {
    if (volunteer) {
      setEditingVolunteer(volunteer);
      setFormData({
        first_name: volunteer.first_name,
        last_name: volunteer.last_name,
        email: volunteer.email,
        phone: volunteer.phone,
        skills: volunteer.skills,
        availability: volunteer.availability,
        experience: volunteer.experience,
        emergency_contact_name: volunteer.emergency_contact_name,
        emergency_contact_phone: volunteer.emergency_contact_phone,
        volunteer_status: volunteer.volunteer_status,
        assigned_role: volunteer.assigned_role,
        t_shirt_size: volunteer.t_shirt_size,
        dietary_requirements: volunteer.dietary_requirements,
        notes: volunteer.notes,
      });
    } else {
      setEditingVolunteer(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        skills: '',
        availability: '',
        experience: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        volunteer_status: 'applied',
        assigned_role: '',
        t_shirt_size: '',
        dietary_requirements: '',
        notes: '',
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVolunteer(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      setError('First name, last name, and email are required');
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

      if (editingVolunteer) {
        await axios.put(`/api/volunteers/${editingVolunteer.id}`, data);
      } else {
        await axios.post('/api/volunteers', data);
      }

      fetchVolunteers();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await axios.delete(`/api/volunteers/${id}`);
        fetchVolunteers();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete volunteer');
      }
    }
  };

  const handleRoleChange = async (volunteerId: number, newRole: string) => {
    try {
      await axios.put(`/api/volunteers/${volunteerId}`, {
        assigned_role: newRole
      });
      fetchVolunteers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleStatusChange = async (volunteerId: number, newStatus: string) => {
    try {
      await axios.put(`/api/volunteers/${volunteerId}`, {
        volunteer_status: newStatus
      });
      fetchVolunteers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update status');
    }
  };

  const getFilteredVolunteers = () => {
    switch (tabValue) {
      case 0: return volunteers; // All
      case 1: return volunteers.filter(v => v.volunteer_status === 'applied'); // Applied
      case 2: return volunteers.filter(v => v.volunteer_status === 'approved'); // Approved
      case 3: return volunteers.filter(v => v.volunteer_status === 'confirmed'); // Confirmed
      default: return volunteers;
    }
  };

  const getVolunteerStats = () => {
    return {
      total: volunteers.length,
      applied: volunteers.filter(v => v.volunteer_status === 'applied').length,
      approved: volunteers.filter(v => v.volunteer_status === 'approved').length,
      confirmed: volunteers.filter(v => v.volunteer_status === 'confirmed').length,
      declined: volunteers.filter(v => v.volunteer_status === 'declined').length,
    };
  };

  const stats = getVolunteerStats();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Volunteer Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => setConfigOpen(true)}
          >
            Registration
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Add Volunteer
          </Button>
        </Box>
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
            <PersonAdd sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="textSecondary">Total Volunteers</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="textSecondary">{stats.applied}</Typography>
            <Typography variant="body2">Applied</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="primary">{stats.approved}</Typography>
            <Typography variant="body2">Approved</Typography>
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
            <Typography variant="h4" color="error.main">{stats.declined}</Typography>
            <Typography variant="body2">Declined</Typography>
          </CardContent>
        </Card>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All Volunteers (${stats.total})`} />
          <Tab label={`Applied (${stats.applied})`} />
          <Tab label={`Approved (${stats.approved})`} />
          <Tab label={`Confirmed (${stats.confirmed})`} />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Pending Applications
                {applications.filter(app => app.status === 'pending').length > 0 && (
                  <Badge 
                    badgeContent={applications.filter(app => app.status === 'pending').length} 
                    color="error"
                  />
                )}
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {tabValue === 4 ? (
        // Pending Applications Tab
        <Box sx={{ display: 'grid', gap: 2 }}>
          {applications.filter(app => app.status === 'pending').length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <PersonAdd sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Pending Applications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New volunteer applications will appear here for review.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            applications
              .filter(app => app.status === 'pending')
              .map((application) => (
                <Card key={application.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {application.firstName} {application.lastName}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{application.email}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                            <Typography variant="body1">{application.phone}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Emergency Contact</Typography>
                            <Typography variant="body1">{application.emergencyContact}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Emergency Phone</Typography>
                            <Typography variant="body1">{application.emergencyPhone}</Typography>
                          </Box>
                        </Box>
                        {application.address && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Address</Typography>
                            <Typography variant="body1">{application.address}</Typography>
                          </Box>
                        )}
                        {application.experience && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Previous Experience</Typography>
                            <Typography variant="body1">{application.experience}</Typography>
                          </Box>
                        )}
                        {application.availability && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Availability</Typography>
                            <Typography variant="body1">{application.availability}</Typography>
                          </Box>
                        )}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Induction Completed</Typography>
                          <Chip 
                            label={application.inductionCompleted ? 'Yes' : 'No'} 
                            color={application.inductionCompleted ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ThumbUp />}
                          onClick={() => handleApproveApplication(application.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<ThumbDown />}
                          onClick={() => handleDeclineApplication(application.id)}
                        >
                          Decline
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
          )}
        </Box>
      ) : (
        // Volunteers Table
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Volunteer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredVolunteers().map((volunteer) => (
              <TableRow key={volunteer.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      {getInitials(volunteer.first_name, volunteer.last_name)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {volunteer.first_name} {volunteer.last_name}
                      </Typography>
                      {volunteer.t_shirt_size && (
                        <Chip 
                          label={`Size: ${volunteer.t_shirt_size}`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {volunteer.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="caption">{volunteer.email}</Typography>
                      </Box>
                    )}
                    {volunteer.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="caption">{volunteer.phone}</Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={volunteer.assigned_role || ''}
                      onChange={(e) => handleRoleChange(volunteer.id, e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">
                        <em>Not assigned</em>
                      </MenuItem>
                      {volunteerRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={volunteer.volunteer_status}
                      color={statusColors[volunteer.volunteer_status]}
                      size="small"
                      icon={
                        volunteer.volunteer_status === 'confirmed' ? <CheckCircle /> :
                        volunteer.volunteer_status === 'declined' ? <Cancel /> :
                        undefined
                      }
                    />
                    {volunteer.volunteer_status === 'applied' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleStatusChange(volunteer.id, 'approved')}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        Approve
                      </Button>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpen(volunteer)}
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(volunteer.id)}
                    size="small"
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
            </Box>

            <TextField
              label="Skills & Experience"
              multiline
              rows={3}
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              fullWidth
              helperText="What skills or experience do you have that would be helpful?"
            />

            <TextField
              label="Availability"
              multiline
              rows={2}
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              fullWidth
              helperText="When are you available during the festival?"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned Role</InputLabel>
                <Select
                  value={formData.assigned_role}
                  onChange={(e) => setFormData({ ...formData, assigned_role: e.target.value })}
                  label="Assigned Role"
                >
                  <MenuItem value="">Not assigned</MenuItem>
                  {volunteerRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.volunteer_status}
                  onChange={(e) => setFormData({ ...formData, volunteer_status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="applied">Applied</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="declined">Declined</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>T-Shirt Size</InputLabel>
                <Select
                  value={formData.t_shirt_size}
                  onChange={(e) => setFormData({ ...formData, t_shirt_size: e.target.value })}
                  label="T-Shirt Size"
                >
                  {tShirtSizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Previous Experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                fullWidth
              />
            </Box>

            <TextField
              label="Dietary Requirements"
              value={formData.dietary_requirements}
              onChange={(e) => setFormData({ ...formData, dietary_requirements: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Emergency Contact Name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Emergency Contact Phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                fullWidth
              />
            </Box>

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
            {loading ? 'Saving...' : editingVolunteer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registration Configuration Dialog */}
      <Dialog 
        open={configOpen} 
        onClose={() => setConfigOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings color="primary" />
          <Typography variant="h5">
            Volunteer Registration Configuration
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 3 }}>
            
            {/* Field Configuration Section */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Field Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure which fields are shown on the registration form and whether they are required.
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                  gap: 2 
                }}>
                  {Object.entries(registrationConfig.fields).map(([fieldName, config]) => (
                    <Card variant="outlined" key={fieldName}>
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                            {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {config.enabled ? <Visibility fontSize="small" color="success" /> : <VisibilityOff fontSize="small" color="disabled" />}
                              <Switch
                                checked={config.enabled}
                                onChange={(e) => saveRegistrationConfig({
                                  ...registrationConfig,
                                  fields: {
                                    ...registrationConfig.fields,
                                    [fieldName]: { ...registrationConfig.fields[fieldName as keyof typeof registrationConfig.fields], enabled: e.target.checked }
                                  }
                                })}
                                size="small"
                              />
                            </Box>
                            {config.enabled && (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={config.required}
                                    onChange={(e) => saveRegistrationConfig({
                                      ...registrationConfig,
                                      fields: {
                                        ...registrationConfig.fields,
                                        [fieldName]: { ...registrationConfig.fields[fieldName as keyof typeof registrationConfig.fields], required: e.target.checked }
                                      }
                                    })}
                                    size="small"
                                  />
                                }
                                label="Required"
                              />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Text Customization Section */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Text Customization</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Customize the welcome and confirmation messages shown to volunteers.
                  </Typography>
                  
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Welcome Section</Typography>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <TextField
                        label="Welcome Title"
                        value={registrationConfig.welcomeTitle}
                        onChange={(e) => saveRegistrationConfig({ ...registrationConfig, welcomeTitle: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        label="Welcome Description"
                        value={registrationConfig.welcomeDescription}
                        onChange={(e) => saveRegistrationConfig({ ...registrationConfig, welcomeDescription: e.target.value })}
                        multiline
                        rows={3}
                        fullWidth
                      />
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Confirmation Section</Typography>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <TextField
                        label="Confirmation Title"
                        value={registrationConfig.confirmationTitle}
                        onChange={(e) => saveRegistrationConfig({ ...registrationConfig, confirmationTitle: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        label="Confirmation Message"
                        value={registrationConfig.confirmationMessage}
                        onChange={(e) => saveRegistrationConfig({ ...registrationConfig, confirmationMessage: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                      />
                    </Box>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Induction Configuration Section */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Induction Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle1">Enable Induction Step</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Show induction information that volunteers must read and confirm
                      </Typography>
                    </Box>
                    <Switch
                      checked={registrationConfig.inductionEnabled}
                      onChange={(e) => saveRegistrationConfig({ ...registrationConfig, inductionEnabled: e.target.checked })}
                    />
                  </Box>

                  {registrationConfig.inductionEnabled && (
                    <>
                      <Divider />
                      <TextField
                        label="Induction Section Title"
                        value={registrationConfig.inductionTitle}
                        onChange={(e) => saveRegistrationConfig({ ...registrationConfig, inductionTitle: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        label="Induction Content"
                        value={registrationConfig.inductionContent}
                        onChange={(e) => saveRegistrationConfig({ ...registrationConfig, inductionContent: e.target.value })}
                        multiline
                        rows={8}
                        fullWidth
                        placeholder="Enter the induction information that volunteers need to read and understand..."
                        helperText="This content will be displayed in a scrollable area. Volunteers must confirm they have read and understood this information."
                      />
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Preview Section */}
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Preview color="primary" />
                  <Typography variant="h6">Registration Form Preview</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => window.open('/volunteer-registration', '_blank')}
                    fullWidth
                  >
                    Open Registration Form
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      saveRegistrationConfig(registrationConfig);
                      window.open('/volunteer-registration', '_blank');
                    }}
                    fullWidth
                  >
                    Save & Preview
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setConfigOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              saveRegistrationConfig(registrationConfig);
              setConfigOpen(false);
            }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Volunteers;