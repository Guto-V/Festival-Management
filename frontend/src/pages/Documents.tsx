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
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CloudUpload,
  GetApp,
  Description,
  PictureAsPdf,
  Assignment,
  Gavel,
  Security,
  CheckCircle,
  Schedule,
  Warning,
} from '@mui/icons-material';
import axios from 'axios';

interface Document {
  id: number;
  name: string;
  description: string;
  document_type: string;
  related_entity_type: string;
  related_entity_id: number;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  status: 'draft' | 'review' | 'approved' | 'signed' | 'expired';
  expiry_date: string;
  version: number;
  tags: string;
  created_at: string;
  updated_at: string;
  uploader_name?: string;
  related_entity_name?: string;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [open, setOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    document_type: '',
    related_entity_type: '',
    related_entity_id: '',
    status: 'draft' as 'draft' | 'review' | 'approved' | 'signed' | 'expired',
    expiry_date: '',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const documentTypes = [
    'Artist Contract',
    'Vendor Agreement',
    'Volunteer Agreement',
    'Insurance Policy',
    'License/Permit',
    'Technical Rider',
    'Hospitality Rider',
    'Risk Assessment',
    'Health & Safety',
    'Marketing Agreement',
    'Sponsorship Contract',
    'Venue Agreement',
    'Equipment Rental',
    'Transport Agreement',
    'Other'
  ];

  const entityTypes = [
    'Artist',
    'Vendor',
    'Volunteer',
    'Venue',
    'Festival',
    'Sponsor',
    'Equipment',
    'General'
  ];

  const statusColors = {
    draft: 'default',
    review: 'warning',
    approved: 'primary',
    signed: 'success',
    expired: 'error'
  } as const;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (error) {
      setError('Failed to fetch documents');
    }
  };

  const handleOpen = (document?: Document) => {
    if (document) {
      setEditingDocument(document);
      setFormData({
        name: document.name,
        description: document.description,
        document_type: document.document_type,
        related_entity_type: document.related_entity_type,
        related_entity_id: document.related_entity_id.toString(),
        status: document.status,
        expiry_date: document.expiry_date ? document.expiry_date.split('T')[0] : '',
        tags: document.tags,
      });
    } else {
      setEditingDocument(null);
      setFormData({
        name: '',
        description: '',
        document_type: '',
        related_entity_type: '',
        related_entity_id: '',
        status: 'draft',
        expiry_date: '',
        tags: '',
      });
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDocument(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setError('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.split('.')[0] });
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.document_type) {
      setError('Document name and type are required');
      return;
    }

    if (!editingDocument && !selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      if (selectedFile) {
        submitData.append('file', selectedFile);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      };

      if (editingDocument) {
        await axios.put(`/api/documents/${editingDocument.id}`, submitData, config);
      } else {
        await axios.post('/api/documents', submitData, config);
      }

      fetchDocuments();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save document');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`/api/documents/${id}`);
        fetchDocuments();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete document');
      }
    }
  };

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const response = await axios.get(`/api/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to download document');
    }
  };

  const getFilteredDocuments = () => {
    switch (tabValue) {
      case 0: return documents; // All
      case 1: return documents.filter(d => d.status === 'draft'); // Draft
      case 2: return documents.filter(d => d.status === 'review'); // Review
      case 3: return documents.filter(d => d.status === 'approved' || d.status === 'signed'); // Approved/Signed
      case 4: return documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()); // Expired
      default: return documents;
    }
  };

  const getDocumentStats = () => {
    const now = new Date();
    return {
      total: documents.length,
      draft: documents.filter(d => d.status === 'draft').length,
      review: documents.filter(d => d.status === 'review').length,
      approved: documents.filter(d => d.status === 'approved' || d.status === 'signed').length,
      expired: documents.filter(d => d.expiry_date && new Date(d.expiry_date) < now).length,
      expiringSoon: documents.filter(d => {
        if (!d.expiry_date) return false;
        const expiryDate = new Date(d.expiry_date);
        const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      }).length,
    };
  };

  const stats = getDocumentStats();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <PictureAsPdf color="error" />;
    if (mimeType.includes('word')) return <Description color="primary" />;
    if (mimeType.includes('image')) return <Assignment color="success" />;
    return <Description />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Document Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Upload Document
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr 1fr' },
        gap: 2,
        mb: 3 
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2 }}>
            <Description sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="textSecondary">Total Documents</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="textSecondary">{stats.draft}</Typography>
            <Typography variant="body2">Draft</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.review}</Typography>
            <Typography variant="body2">In Review</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="success.main">{stats.approved}</Typography>
            <Typography variant="body2">Approved</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="error.main">{stats.expired}</Typography>
            <Typography variant="body2">Expired</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" color="warning.main">{stats.expiringSoon}</Typography>
            <Typography variant="body2">Expiring Soon</Typography>
          </CardContent>
        </Card>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Draft (${stats.draft})`} />
          <Tab label={`Review (${stats.review})`} />
          <Tab label={`Approved (${stats.approved})`} />
          <Tab label={`Expired (${stats.expired})`} />
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Related To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredDocuments().map((document) => (
              <TableRow key={document.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getFileIcon(document.mime_type)}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {document.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatFileSize(document.file_size)} • v{document.version}
                      </Typography>
                      {document.description && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          {document.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={document.document_type} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {document.related_entity_type}
                    {document.related_entity_name && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {document.related_entity_name}
                      </Typography>
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={document.status}
                    color={statusColors[document.status]}
                    size="small"
                    icon={
                      document.status === 'signed' ? <CheckCircle /> :
                      document.status === 'expired' ? <Warning /> :
                      undefined
                    }
                  />
                </TableCell>
                <TableCell>
                  {document.expiry_date ? (
                    <Typography variant="body2" color={
                      new Date(document.expiry_date) < new Date() ? 'error' : 
                      (new Date(document.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 30 ? 'warning.main' : 
                      'textPrimary'
                    }>
                      {new Date(document.expiry_date).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No expiry
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDownload(document.id, document.name)}
                    size="small"
                    title="Download"
                  >
                    <GetApp />
                  </IconButton>
                  <IconButton
                    onClick={() => handleOpen(document)}
                    size="small"
                    title="Edit"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(document.id)}
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

      {/* Upload/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDocument ? 'Edit Document' : 'Upload New Document'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* File Upload */}
          {!editingDocument && (
            <Box sx={{ mb: 3, p: 2, border: '2px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls"
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 2 }}
                >
                  Select File
                </Button>
              </label>
              
              {selectedFile && (
                <Box>
                  <Typography variant="body2" color="primary">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </Typography>
                </Box>
              )}
              
              {uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="textSecondary">
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}
              
              <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                Supported formats: PDF, Word, Excel, Images, Text (Max 10MB)
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Document Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  label="Document Type"
                >
                  {documentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
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
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="review">In Review</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="signed">Signed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Related To</InputLabel>
                <Select
                  value={formData.related_entity_type}
                  onChange={(e) => setFormData({ ...formData, related_entity_type: e.target.value })}
                  label="Related To"
                >
                  {entityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Entity ID"
                type="number"
                value={formData.related_entity_id}
                onChange={(e) => setFormData({ ...formData, related_entity_id: e.target.value })}
                fullWidth
                helperText="ID of the related artist, vendor, etc."
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Expiry Date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                fullWidth
                helperText="Comma-separated tags for easier searching"
              />
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
            {loading ? 'Saving...' : editingDocument ? 'Update' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;