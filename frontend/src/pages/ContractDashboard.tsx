import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Send,
  Visibility,
  PendingActions,
  Delete,
  ContentCopy,
  Add,
  Edit,
  Block,
  Refresh,
  EditNote,
  MoreVert,
  Link,
  Description,
} from '@mui/icons-material';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

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

interface ContractDetails {
  id: number;
  artist_id: number;
  artist_name: string;
  template_name: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'void';
  secure_token: string;
  deadline: string;
  sent_at: string;
  viewed_at: string;
  signed_at: string;
  created_at: string;
  first_name: string;
  last_name: string;
}

const ContractDashboard: React.FC = () => {
  const { currentFestival } = useFestival();
  const [contracts, setContracts] = useState<ContractDetails[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    content: '',
    is_default: false,
  });
  const [contractMenuAnchor, setContractMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedContractForMenu, setSelectedContractForMenu] = useState<ContractDetails | null>(null);

  useEffect(() => {
    if (currentFestival) {
      fetchDashboardData();
      fetchTemplates();
    }
  }, [currentFestival]);

  const fetchDashboardData = async () => {
    if (!currentFestival) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/artists?festival_id=${currentFestival.id}`);
      const artists = response.data;
      
      let allContracts: ContractDetails[] = [];
      
      // Fetch contracts for each artist
      await Promise.all(
        artists.map(async (artist: any) => {
          try {
            const contractResponse = await axios.get(`/api/contracts/artist/${artist.id}`);
            allContracts = [...allContracts, ...contractResponse.data];
          } catch (error) {
            // Artist might not have contracts yet
          }
        })
      );

      setContracts(allContracts);
      setError('');
    } catch (error) {
      setError('Failed to fetch contract data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/contracts/templates?festival_id=${currentFestival.id}`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleSendContract = async (artistId: number, contractId: number) => {
    setLoading(true);
    try {
      await axios.put(`/api/contracts/artist/${artistId}/${contractId}/send`);
      fetchDashboardData(); // Refresh data
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
      fetchDashboardData(); // Refresh data
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
      fetchDashboardData(); // Refresh data
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
      fetchDashboardData(); // Refresh data
      setError('');
      alert('Contract resent successfully! A new link has been generated.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to resend contract');
    } finally {
      setLoading(false);
    }
  };

  const handleContractMenuClick = (event: React.MouseEvent<HTMLElement>, contract: ContractDetails) => {
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

  const copyContractLink = (token: string) => {
    const link = `${window.location.origin}/contract/${token}`;
    navigator.clipboard.writeText(link);
    alert('Contract link copied to clipboard!');
  };

  // Template management functions
  const handleTemplateOpen = (template?: ContractTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        is_default: template.is_default,
      });
    } else {
      setEditingTemplate(null);
      setTemplateFormData({
        name: '',
        description: '',
        content: `PERFORMANCE AGREEMENT

Festival: {{festival_name}}
Artist/Performer: {{artist_name}}
Contact: {{artist_contact}}
Performance Date: {{performance_date}}
Performance Time: {{performance_time}}
Venue/Stage: {{performance_venue}}

TERMS AND CONDITIONS:

1. PERFORMANCE DETAILS
The Artist agrees to perform at the above festival on the specified date and time.

2. PAYMENT
Fee: {{artist_fee}}
Payment terms: To be agreed upon contract signing.

3. TECHNICAL REQUIREMENTS
{{technical_requirements}}

4. RIDER REQUIREMENTS  
{{rider_requirements}}

5. CANCELLATION
Both parties may cancel this agreement with reasonable notice.

6. LIABILITY
The Festival will provide public liability insurance.

7. AGREEMENT
By signing below, both parties agree to the terms and conditions set forth in this Performance Agreement.

Date: {{current_date}}`,
        is_default: false,
      });
    }
    setTemplateDialogOpen(true);
    setError('');
  };

  const handleTemplateClose = () => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    setError('');
  };

  const handleTemplatePreview = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleTemplateSubmit = async () => {
    if (!templateFormData.name.trim() || !templateFormData.content.trim()) {
      setError('Name and content are required');
      return;
    }

    if (!currentFestival) {
      setError('No festival selected');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...templateFormData,
        festival_id: currentFestival.id,
      };

      if (editingTemplate) {
        await axios.put(`/api/contracts/templates/${editingTemplate.id}`, data);
      } else {
        await axios.post('/api/contracts/templates', data);
      }

      fetchTemplates();
      handleTemplateClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this contract template?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/contracts/templates/${id}`);
        fetchTemplates();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete template');
        setLoading(false);
      }
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => (
      <Typography 
        key={index} 
        variant="body2" 
        sx={{ 
          mb: paragraph.trim() === '' ? 0.5 : 1,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          fontSize: '0.8rem',
        }}
      >
        {paragraph}
      </Typography>
    ));
  };

  const placeholderInfo = [
    '{{festival_name}} - Festival name',
    '{{artist_name}} - Artist/band name', 
    '{{artist_contact}} - Artist contact person',
    '{{current_date}} - Today\'s date',
    '{{artist_fee}} - Artist performance fee',
    '{{technical_requirements}} - Artist technical needs',
    '{{rider_requirements}} - Artist rider requirements',
    '{{performance_date}} - Scheduled performance date',
    '{{performance_time}} - Scheduled performance time',
    '{{performance_venue}} - Stage/venue name',
  ];

  if (!currentFestival) {
    return (
      <Alert severity="warning">
        Please select a festival to view contract dashboard.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Contract Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {currentFestival.name} - Create and manage contracts
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs for Contracts and Templates */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Active Contracts" />
          <Tab label="Contract Templates" />
        </Tabs>
      </Box>

      {/* Contracts Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Contracts
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Artist</TableCell>
                    <TableCell>Template</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {contract.artist_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {contract.template_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={contract.status}
                          color={getContractStatusColor(contract.status) as any}
                          size="small"
                          icon={getContractStatusIcon(contract.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {contract.deadline ? (
                          <Typography variant="body2">
                            {new Date(contract.deadline).toLocaleDateString()}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No deadline
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {contract.first_name} {contract.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {contract.sent_at && (
                            <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                              Sent: {new Date(contract.sent_at).toLocaleDateString()}
                            </Typography>
                          )}
                          {contract.viewed_at && (
                            <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                              Viewed: {new Date(contract.viewed_at).toLocaleDateString()}
                            </Typography>
                          )}
                          {contract.signed_at && (
                            <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                              Signed: {new Date(contract.signed_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          {contract.status === 'draft' && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Send />}
                              onClick={() => handleSendContract(contract.artist_id, contract.id)}
                              disabled={loading}
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {contracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                          <Assignment sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                          <Typography variant="body1">
                            No contracts found. Create contracts for your artists to get started!
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Templates Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Contract Templates
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleTemplateOpen()}
              >
                Add Template
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Template Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Default</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {template.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {template.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {template.is_default && (
                          <Chip label="Default" color="primary" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {template.first_name} {template.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(template.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleTemplatePreview(template)}
                          title="Preview"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleTemplateOpen(template)}
                          title="Edit"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleTemplateDelete(template.id)}
                          color="error"
                          title="Delete"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                          <Assignment sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                          <Typography variant="body1">
                            No contract templates found. Add your first template to get started!
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Template Editor Dialog */}
      <Dialog open={templateDialogOpen} onClose={handleTemplateClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Contract Template' : 'Add New Contract Template'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Template Name"
              value={templateFormData.name}
              onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
              required
              fullWidth
            />
            
            <TextField
              label="Description"
              value={templateFormData.description}
              onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={templateFormData.is_default}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, is_default: e.target.checked })}
                />
              }
              label="Set as default template"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 2 }}>
              <TextField
                label="Contract Content"
                multiline
                rows={20}
                value={templateFormData.content}
                onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
                required
                fullWidth
                placeholder="Enter your contract template content here..."
              />
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Available Placeholders
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Use these placeholders in your template. They will be automatically replaced with actual data when contracts are created.
                  </Typography>
                  <Box>
                    {placeholderInfo.map((info, index) => (
                      <Typography key={index} variant="caption" sx={{ display: 'block', mb: 0.5, fontFamily: 'monospace' }}>
                        {info}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTemplateClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTemplateSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Preview: {selectedTemplate?.name}
          </Typography>
          {selectedTemplate?.is_default && (
            <Chip label="Default Template" color="primary" size="small" />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedTemplate && (
            <Box>
              {selectedTemplate.description && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {selectedTemplate.description}
                </Alert>
              )}
              <Paper sx={{ p: 3, bgcolor: 'grey.50', maxHeight: '600px', overflow: 'auto' }}>
                {formatContent(selectedTemplate.content)}
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Created by {selectedTemplate.first_name} {selectedTemplate.last_name} on{' '}
                {new Date(selectedTemplate.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          {selectedTemplate && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => {
                setPreviewOpen(false);
                handleTemplateOpen(selectedTemplate);
              }}
            >
              Edit Template
            </Button>
          )}
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
                handleResendContract(selectedContractForMenu.artist_id, selectedContractForMenu.id);
                handleContractMenuClose();
              }}>
                <ListItemIcon>
                  <Refresh />
                </ListItemIcon>
                <ListItemText>Resend</ListItemText>
              </MenuItem>
            )}
            
            <MenuItem onClick={() => {
              // Note: Amend functionality would need template integration for Contract Dashboard
              alert('Amend functionality available in Artist detail panel');
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
              handleVoidContract(selectedContractForMenu.artist_id, selectedContractForMenu.id);
              handleContractMenuClose();
            }}>
              <ListItemIcon>
                <Block />
              </ListItemIcon>
              <ListItemText>Void Contract</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => {
              handleDeleteContract(selectedContractForMenu.artist_id, selectedContractForMenu.id);
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

export default ContractDashboard;