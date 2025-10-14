import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Google,
  Link,
  Sync,
  Settings,
  CheckCircle,
  Error,
  Schedule,
  Launch,
  Refresh,
} from '@mui/icons-material';
import googleSheetsService from '../services/googleSheetsService';

interface GoogleSheetsSettingsProps {
  open: boolean;
  onClose: () => void;
}

const GoogleSheetsSettings: React.FC<GoogleSheetsSettingsProps> = ({ open, onClose }) => {
  const [config, setConfig] = useState({
    spreadsheetId: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
  });
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncInterval: 60,
    lastSync: null as Date | null,
    spreadsheetUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [open]);

  const loadSettings = () => {
    const settings = googleSheetsService.getSyncSettings();
    setSyncSettings(settings);
    setIsConfigured(googleSheetsService.isConfigured());
    setIsAuthenticated(googleSheetsService.isAuthenticated());
  };

  const handleConfigChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSyncSettingChange = (field: string, value: any) => {
    setSyncSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveConfiguration = async () => {
    if (!config.spreadsheetId.trim()) {
      setError('Spreadsheet ID is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      googleSheetsService.saveConfig(config);
      
      // Update spreadsheet URL
      const newSyncSettings = {
        ...syncSettings,
        spreadsheetUrl: googleSheetsService.getSpreadsheetUrl()
      };
      setSyncSettings(newSyncSettings);
      googleSheetsService.saveSyncSettings(newSyncSettings);
      
      setIsConfigured(true);
      setSuccess('Configuration saved successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const success = await googleSheetsService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        setSuccess('Successfully authenticated with Google Sheets');
      } else {
        setError('Authentication failed');
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const createNewSpreadsheet = async () => {
    setLoading(true);
    setError('');
    try {
      const spreadsheetId = await googleSheetsService.createSpreadsheet('Festival Management Data');
      if (spreadsheetId) {
        setConfig(prev => ({ ...prev, spreadsheetId }));
        const newSyncSettings = {
          ...syncSettings,
          spreadsheetUrl: googleSheetsService.getSpreadsheetUrl()
        };
        setSyncSettings(newSyncSettings);
        googleSheetsService.saveSyncSettings(newSyncSettings);
        setSuccess('New spreadsheet created successfully');
      } else {
        setError('Failed to create spreadsheet');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  const syncAllData = async () => {
    setSyncing(true);
    setError('');
    try {
      const success = await googleSheetsService.exportAllData();
      if (success) {
        const updatedSettings = {
          ...syncSettings,
          lastSync: new Date()
        };
        setSyncSettings(updatedSettings);
        googleSheetsService.saveSyncSettings(updatedSettings);
        setSuccess('Data synchronized successfully');
      } else {
        setError('Synchronization failed');
      }
    } catch (error: any) {
      setError(error.message || 'Synchronization failed');
    } finally {
      setSyncing(false);
    }
  };

  const saveSyncSettings = () => {
    googleSheetsService.saveSyncSettings(syncSettings);
    setSuccess('Sync settings saved');
  };

  const openSpreadsheet = () => {
    if (syncSettings.spreadsheetUrl) {
      window.open(syncSettings.spreadsheetUrl, '_blank');
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Google color="primary" />
        Google Sheets Integration
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Status Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Integration Status</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Chip 
                icon={isConfigured ? <CheckCircle /> : <Error />}
                label={isConfigured ? 'Configured' : 'Not Configured'}
                color={isConfigured ? 'success' : 'default'}
                variant="outlined"
              />
              <Chip 
                icon={isAuthenticated ? <CheckCircle /> : <Error />}
                label={isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                color={isAuthenticated ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>
            {syncSettings.lastSync && (
              <Typography variant="body2" color="textSecondary">
                Last sync: {formatLastSync(syncSettings.lastSync)}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Configuration Section */}
        <Typography variant="h6" gutterBottom>
          📋 Configuration
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <Alert severity="info">
            <Typography variant="body2">
              To set up Google Sheets integration, you'll need to create a Google Cloud Project and enable the Google Sheets API. 
              For this demo, you can use any spreadsheet ID from an existing Google Sheet.
            </Typography>
          </Alert>
          
          <TextField
            label="Spreadsheet ID"
            value={config.spreadsheetId}
            onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
            fullWidth
            helperText="The ID from your Google Sheets URL (e.g., the part between /d/ and /edit)"
          />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Google API Key"
              value={config.apiKey}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              type="password"
              helperText="Your Google Cloud API key"
            />
            <TextField
              label="Client ID"
              value={config.clientId}
              onChange={(e) => handleConfigChange('clientId', e.target.value)}
              helperText="OAuth 2.0 Client ID"
            />
          </Box>
          
          <Button
            variant="outlined"
            onClick={saveConfiguration}
            disabled={loading}
            sx={{ alignSelf: 'flex-start' }}
          >
            Save Configuration
          </Button>
        </Box>

        {/* Authentication Section */}
        <Typography variant="h6" gutterBottom>
          🔐 Authentication
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            For this demo, authentication is simulated. In a real implementation, this would redirect to Google OAuth.
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Google />}
              onClick={authenticateWithGoogle}
              disabled={loading || !isConfigured}
            >
              {isAuthenticated ? 'Re-authenticate' : 'Authenticate with Google'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Link />}
              onClick={createNewSpreadsheet}
              disabled={loading || !isAuthenticated}
            >
              Create New Spreadsheet
            </Button>
          </Box>
        </Box>

        {/* Sync Settings */}
        <Typography variant="h6" gutterBottom>
          ⚙️ Sync Settings
        </Typography>
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={syncSettings.autoSync}
                onChange={(e) => handleSyncSettingChange('autoSync', e.target.checked)}
              />
            }
            label="Enable automatic synchronization"
          />
          
          {syncSettings.autoSync && (
            <Box sx={{ mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sync Interval</InputLabel>
                <Select
                  value={syncSettings.syncInterval}
                  onChange={(e) => handleSyncSettingChange('syncInterval', e.target.value)}
                  label="Sync Interval"
                >
                  <MenuItem value={15}>Every 15 minutes</MenuItem>
                  <MenuItem value={30}>Every 30 minutes</MenuItem>
                  <MenuItem value={60}>Every hour</MenuItem>
                  <MenuItem value={180}>Every 3 hours</MenuItem>
                  <MenuItem value={360}>Every 6 hours</MenuItem>
                  <MenuItem value={720}>Every 12 hours</MenuItem>
                  <MenuItem value={1440}>Daily</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={saveSyncSettings}
              size="small"
            >
              Save Sync Settings
            </Button>
          </Box>
        </Box>

        {/* Manual Sync Section */}
        <Typography variant="h6" gutterBottom>
          🔄 Manual Synchronization
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Sync />}
              onClick={syncAllData}
              disabled={syncing || !isAuthenticated || !isConfigured}
            >
              {syncing ? 'Syncing...' : 'Sync All Data'}
            </Button>
            
            {syncSettings.spreadsheetUrl && (
              <Tooltip title="Open in Google Sheets">
                <IconButton onClick={openSpreadsheet} color="primary">
                  <Launch />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          {syncing && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="textSecondary">
                Synchronizing data to Google Sheets...
              </Typography>
            </Box>
          )}
          
          <Alert severity="info">
            <Typography variant="body2">
              Manual sync will export all artists, schedule, budget, volunteers, and vendors data to separate sheets in your Google Spreadsheet.
            </Typography>
          </Alert>
        </Box>

        {/* Export Options */}
        <Typography variant="h6" gutterBottom>
          📊 Export Options
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button 
            size="small" 
            variant="outlined"
            disabled={!isAuthenticated || !isConfigured}
            onClick={() => googleSheetsService.exportArtists([])}
          >
            Export Artists
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            disabled={!isAuthenticated || !isConfigured}
            onClick={() => googleSheetsService.exportSchedule([])}
          >
            Export Schedule
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            disabled={!isAuthenticated || !isConfigured}
            onClick={() => googleSheetsService.exportBudget([])}
          >
            Export Budget
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            disabled={!isAuthenticated || !isConfigured}
            onClick={() => googleSheetsService.exportVolunteers([])}
          >
            Export Volunteers
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            disabled={!isAuthenticated || !isConfigured}
            onClick={() => googleSheetsService.exportVendors([])}
          >
            Export Vendors
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleSheetsSettings;