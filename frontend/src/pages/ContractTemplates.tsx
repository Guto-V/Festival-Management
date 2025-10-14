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
  Alert,
  Chip,
  IconButton,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Assignment,
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

const ContractTemplates: React.FC = () => {
  const { currentFestival } = useFestival();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    is_default: false,
  });

  useEffect(() => {
    if (currentFestival) {
      fetchTemplates();
    }
  }, [currentFestival]);

  const fetchTemplates = async () => {
    if (!currentFestival) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/contracts/templates?festival_id=${currentFestival.id}`);
      setTemplates(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch contract templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (template?: ContractTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        is_default: template.is_default,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
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
The Artist agrees to perform at the above festival on the specified date and time. The performance duration will be as agreed in schedule communications.

2. PAYMENT
Fee: {{artist_fee}}
Payment terms: To be agreed upon contract signing.

3. TECHNICAL REQUIREMENTS
The Artist's technical requirements are as follows:
{{technical_requirements}}

4. RIDER REQUIREMENTS  
The Artist's rider requirements are as follows:
{{rider_requirements}}

5. CANCELLATION
Both parties may cancel this agreement with reasonable notice. In case of cancellation by the Festival, the Artist will be compensated according to the agreed terms.

6. LIABILITY
The Festival will provide public liability insurance. The Artist is responsible for their own equipment and personal insurance.

7. AGREEMENT
By signing below, both parties agree to the terms and conditions set forth in this Performance Agreement.

Date: {{current_date}}

This agreement is subject to the terms and conditions outlined above and any additional agreements made in writing.`,
        is_default: false,
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTemplate(null);
    setError('');
  };

  const handlePreview = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
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
        ...formData,
        festival_id: currentFestival.id,
      };

      if (editingTemplate) {
        await axios.put(`/api/contracts/templates/${editingTemplate.id}`, data);
      } else {
        await axios.post('/api/contracts/templates', data);
      }

      fetchTemplates();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Contract Templates</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add Template
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
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
                    onClick={() => handlePreview(template)}
                    title="Preview"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(template)}
                    title="Edit"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(template.id)}
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
                  No contract templates found. Add your first template to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Template Editor Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Contract Template' : 'Add New Contract Template'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
              }
              label="Set as default template"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 2 }}>
              <TextField
                label="Contract Content"
                multiline
                rows={20}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
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
                handleOpen(selectedTemplate);
              }}
            >
              Edit Template
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractTemplates;