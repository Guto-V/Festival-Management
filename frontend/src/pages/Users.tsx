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
  Switch,
  FormControlLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
  Security,
  Email,
  Phone,
  Schedule,
  CheckCircle,
  Cancel,
  ExpandMore,
  VpnKey,
  Visibility,
  VisibilityOff,
  Event,
  Lock,
  LockOpen,
} from '@mui/icons-material';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'coordinator' | 'viewer' | 'volunteer';
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  phone?: string;
  last_login: string;
  permissions: string[];
  event_access: 'all' | 'specific';
  allowed_events: number[];
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const Users: React.FC = () => {
  const { festivals } = useFestival();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [open, setOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const getInitialFormData = () => ({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer' as 'admin' | 'coordinator' | 'viewer' | 'volunteer',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    phone: '',
    password: '',
    confirmPassword: '',
    permissions: [] as string[],
    event_access: 'all' as 'all' | 'specific',
    allowed_events: [] as number[],
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'coordinator', label: 'Coordinator', description: 'Manage events and schedules' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    { value: 'volunteer', label: 'Volunteer', description: 'Limited volunteer access' },
  ];

  const statusColors = {
    active: 'success',
    inactive: 'default',
    suspended: 'error'
  } as const;

  const roleColors = {
    admin: 'error',
    coordinator: 'primary',
    viewer: 'default',
    volunteer: 'secondary'
  } as const;

  const defaultPermissions = {
    admin: [
      'users.create', 'users.edit', 'users.delete', 'users.view',
      'artists.create', 'artists.edit', 'artists.delete', 'artists.view',
      'venues.create', 'venues.edit', 'venues.delete', 'venues.view',
      'schedule.create', 'schedule.edit', 'schedule.delete', 'schedule.view',
      'budget.create', 'budget.edit', 'budget.delete', 'budget.view',
      'documents.create', 'documents.edit', 'documents.delete', 'documents.view',
      'vendors.create', 'vendors.edit', 'vendors.delete', 'vendors.view',
      'volunteers.create', 'volunteers.edit', 'volunteers.delete', 'volunteers.view',
      'reports.view', 'system.admin'
    ],
    coordinator: [
      'artists.create', 'artists.edit', 'artists.view',
      'venues.create', 'venues.edit', 'venues.view',
      'schedule.create', 'schedule.edit', 'schedule.view',
      'budget.view', 'documents.view',
      'vendors.create', 'vendors.edit', 'vendors.view',
      'volunteers.create', 'volunteers.edit', 'volunteers.view',
      'reports.view'
    ],
    viewer: [
      'artists.view', 'venues.view', 'schedule.view',
      'budget.view', 'documents.view', 'vendors.view', 'volunteers.view'
    ],
    volunteer: [
      'schedule.view', 'volunteers.view'
    ]
  };

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  const fetchPermissions = async () => {
    try {
      // Mock permissions data - in real app this would come from backend
      const mockPermissions: Permission[] = [
        { id: 'users.view', name: 'View Users', description: 'View user list and details', category: 'User Management' },
        { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', category: 'User Management' },
        { id: 'users.edit', name: 'Edit Users', description: 'Edit user information', category: 'User Management' },
        { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', category: 'User Management' },
        { id: 'artists.view', name: 'View Artists', description: 'View artist information', category: 'Artists' },
        { id: 'artists.create', name: 'Create Artists', description: 'Add new artists', category: 'Artists' },
        { id: 'artists.edit', name: 'Edit Artists', description: 'Edit artist information', category: 'Artists' },
        { id: 'artists.delete', name: 'Delete Artists', description: 'Remove artists', category: 'Artists' },
        { id: 'schedule.view', name: 'View Schedule', description: 'View event schedules', category: 'Schedule' },
        { id: 'schedule.create', name: 'Create Schedule', description: 'Create new schedule items', category: 'Schedule' },
        { id: 'schedule.edit', name: 'Edit Schedule', description: 'Edit schedule items', category: 'Schedule' },
        { id: 'schedule.delete', name: 'Delete Schedule', description: 'Remove schedule items', category: 'Schedule' },
        { id: 'budget.view', name: 'View Budget', description: 'View budget information', category: 'Finance' },
        { id: 'budget.create', name: 'Create Budget', description: 'Create budget items', category: 'Finance' },
        { id: 'budget.edit', name: 'Edit Budget', description: 'Edit budget items', category: 'Finance' },
        { id: 'budget.delete', name: 'Delete Budget', description: 'Remove budget items', category: 'Finance' },
        { id: 'reports.view', name: 'View Reports', description: 'Access reporting dashboard', category: 'Reports' },
        { id: 'system.admin', name: 'System Admin', description: 'Full system administration', category: 'System' },
      ];
      setPermissions(mockPermissions);
    } catch (error) {
      setError('Failed to fetch permissions');
    }
  };

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'viewer',
        status: user.status || 'active',
        phone: user.phone || '',
        password: '',
        confirmPassword: '',
        permissions: user.permissions || [],
        event_access: user.event_access || 'all',
        allowed_events: user.allowed_events || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        ...getInitialFormData(),
        permissions: defaultPermissions.viewer,
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setPasswordDialogOpen(false);
    setEditingUser(null);
    setError('');
  };

  const handleRoleChange = (newRole: string) => {
    const rolePermissions = defaultPermissions[newRole as keyof typeof defaultPermissions] || [];
    setFormData({
      ...formData,
      role: newRole as any,
      permissions: rolePermissions,
      // Admins get access to all events by default
      event_access: newRole === 'admin' ? 'all' : formData.event_access
    });
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const newPermissions = checked
      ? [...formData.permissions, permissionId]
      : formData.permissions.filter(p => p !== permissionId);
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleEventAccessChange = (eventId: number, hasAccess: boolean) => {
    const newAllowedEvents = hasAccess
      ? [...formData.allowed_events, eventId]
      : formData.allowed_events.filter(id => id !== eventId);
    
    setFormData({ ...formData, allowed_events: newAllowedEvents });
  };

  const handleSubmit = async () => {
    if (!formData) {
      setError('Form data is not available');
      return;
    }

    if (!formData.username?.trim() || !formData.email?.trim() || !formData.first_name?.trim() || !formData.last_name?.trim()) {
      setError('Username, email, first name, and last name are required');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.event_access === 'specific' && formData.allowed_events?.length === 0) {
      setError('Please select at least one event for specific access');
      return;
    }

    setLoading(true);
    try {
      const data = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
        permissions: formData.permissions,
        event_access: formData.event_access,
        allowed_events: formData.event_access === 'specific' ? formData.allowed_events : [],
        ...(formData.password && { password: formData.password })
      };

      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, data);
      } else {
        await axios.post('/api/users', data);
      }

      fetchUsers();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const resetPassword = async (userId: number) => {
    try {
      await axios.post(`/api/users/${userId}/reset-password`);
      setError('Password reset email sent successfully');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to reset password');
    }
  };

  const getFilteredUsers = () => {
    switch (tabValue) {
      case 0: return users; // All
      case 1: return users.filter(u => u.status === 'active'); // Active
      case 2: return users.filter(u => u.role === 'admin' || u.role === 'coordinator'); // Staff
      case 3: return users.filter(u => u.status === 'inactive' || u.status === 'suspended'); // Inactive
      default: return users;
    }
  };

  const getUserStats = () => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      admins: users.filter(u => u.role === 'admin').length,
      coordinators: users.filter(u => u.role === 'coordinator').length,
      viewers: users.filter(u => u.role === 'viewer').length,
      volunteers: users.filter(u => u.role === 'volunteer').length,
      inactive: users.filter(u => u.status === 'inactive' || u.status === 'suspended').length,
      verified: users.filter(u => u.email_verified).length,
    };
  };

  const stats = getUserStats();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const groupPermissionsByCategory = () => {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });
    return grouped;
  };

  const permissionGroups = groupPermissionsByCategory();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add User
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(6, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center', height: 140, py: 2 }}>
              <Person sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="body2" color="textSecondary">Total Users</Typography>
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
              <Typography variant="h4" color="error.main">{stats.admins}</Typography>
              <Typography variant="body2">Admins</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h4" color="primary">{stats.coordinators}</Typography>
              <Typography variant="body2">Coordinators</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h4" color="secondary">{stats.volunteers}</Typography>
              <Typography variant="body2">Volunteers</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h4" color="success.main">{stats.verified}</Typography>
              <Typography variant="body2">Verified</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Active (${stats.active})`} />
          <Tab label={`Staff (${stats.admins + stats.coordinators})`} />
          <Tab label={`Inactive (${stats.inactive})`} />
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Event Access</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredUsers().map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: roleColors[user.role] }}>
                      {getInitials(user.first_name, user.last_name)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        @{user.username}
                      </Typography>
                      {user.email_verified && (
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main', ml: 1 }} />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={roleColors[user.role]}
                    icon={user.role === 'admin' ? <AdminPanelSettings /> : <Security />}
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="caption">{user.email}</Typography>
                    </Box>
                    {user.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="caption">{user.phone}</Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={statusColors[user.status]}
                    icon={
                      user.status === 'active' ? <CheckCircle /> :
                      user.status === 'suspended' ? <Cancel /> :
                      undefined
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(user.event_access === 'all' || user.role === 'admin') ? (
                      <>
                        <LockOpen fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          All Events
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Lock fontSize="small" color="warning" />
                        <Typography variant="body2" color="warning.main">
                          {user.allowed_events?.length || 0} Event(s)
                        </Typography>
                      </>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {user.last_login ? (
                    <Typography variant="body2">
                      {new Date(user.last_login).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Never
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpen(user)}
                    size="small"
                    title="Edit"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => resetPassword(user.id)}
                    size="small"
                    title="Reset Password"
                  >
                    <VpnKey />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(user.id)}
                    size="small"
                    color="error"
                    title="Delete"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
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
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                fullWidth
              />
            </Box>

            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Box>
                        <Typography variant="body2">{role.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {role.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {!editingUser && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
                <TextField
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required={!editingUser}
                  fullWidth
                />
              </Box>
            )}

            {/* Event Access Control */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Event Access</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Control which events this user can access
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Event Access Type</InputLabel>
              <Select
                value={formData.event_access}
                onChange={(e) => setFormData({ ...formData, event_access: e.target.value as 'all' | 'specific' })}
                label="Event Access Type"
                disabled={formData.role === 'admin'}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockOpen fontSize="small" />
                    <Box>
                      <Typography variant="body2">All Events</Typography>
                      <Typography variant="caption" color="textSecondary">
                        User can access all current and future events
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="specific">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lock fontSize="small" />
                    <Box>
                      <Typography variant="body2">Specific Events Only</Typography>
                      <Typography variant="caption" color="textSecondary">
                        User can only access selected events
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {formData.role === 'admin' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Administrators automatically have access to all events
              </Alert>
            )}

            {formData.event_access === 'specific' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Select Events ({formData.allowed_events.length} selected)
                </Typography>
                <List sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                  {festivals.map((festival) => (
                    <ListItem key={festival.id} dense>
                      <ListItemIcon>
                        <Event />
                      </ListItemIcon>
                      <ListItemText
                        primary={festival.name}
                        secondary={`${new Date(festival.start_date).getFullYear()} • ${festival.status}`}
                      />
                      <ListItemSecondaryAction>
                        <Checkbox
                          checked={formData.allowed_events.includes(festival.id)}
                          onChange={(e) => handleEventAccessChange(festival.id, e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {festivals.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No events available"
                        secondary="Create events in the Events section first"
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}

            {/* Permissions */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Permissions</Typography>
            {Object.entries(permissionGroups).map(([category, categoryPermissions]) => (
              <Accordion key={category}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">{category}</Typography>
                  <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                    ({categoryPermissions.filter(p => formData.permissions.includes(p.id)).length}/{categoryPermissions.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {categoryPermissions.map((permission) => (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            checked={formData.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{permission.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {permission.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;