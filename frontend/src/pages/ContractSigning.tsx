import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Divider,
  Container,
} from '@mui/material';
import {
  CheckCircle,
  Assignment,
  Download,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface ContractData {
  id: number;
  artist_name: string;
  festival_name: string;
  content: string;
  status: string;
  deadline: string;
  signed_at: string;
}

const ContractSigning: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchContract();
    }
  }, [token]);

  const fetchContract = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/contracts/public/${token}`);
      setContract(response.data);
      setError('');

      // If already signed, show success
      if (response.data.status === 'signed') {
        setSuccess(true);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Contract not found or no longer available');
      } else {
        setError('Failed to load contract. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!token || !agreed) return;

    setSigning(true);
    try {
      const signatureData = {
        timestamp: new Date().toISOString(),
        ip_address: 'client', // Could be enhanced to get actual IP
        user_agent: navigator.userAgent,
      };

      await axios.post(`/api/contracts/public/${token}/sign`, {
        signature_data: JSON.stringify(signatureData),
      });

      setSuccess(true);
      setError('');
      
      // Refresh contract to show signed status
      fetchContract();
    } catch (error: any) {
      if (error.response?.status === 400) {
        setError(error.response.data.error || 'Contract cannot be signed at this time');
      } else {
        setError('Failed to sign contract. Please try again.');
      }
    } finally {
      setSigning(false);
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => (
      <Typography 
        key={index} 
        variant="body1" 
        sx={{ 
          mb: paragraph.trim() === '' ? 1 : 2,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
        }}
      >
        {paragraph}
      </Typography>
    ));
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading contract...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !contract) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Contract not found'}
          </Alert>
          <Typography variant="body1" color="text.secondary">
            Please check the contract link or contact the festival organizers for assistance.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (success || contract.status === 'signed') {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Card sx={{ mb: 4, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Contract Signed Successfully!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Thank you, {contract.artist_name}. Your performance contract for {contract.festival_name} has been signed and recorded.
              </Typography>
              {contract.signed_at && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Signed on: {new Date(contract.signed_at).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment />
              Contract Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ maxHeight: '400px', overflow: 'auto', mb: 3 }}>
              {formatContent(contract.content)}
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  const isExpired = contract.deadline && new Date() > new Date(contract.deadline);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h4" gutterBottom>
            Performance Contract
          </Typography>
          <Typography variant="h6">
            {contract.festival_name}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Artist: {contract.artist_name}
          </Typography>
          {contract.deadline && (
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Response required by: {new Date(contract.deadline).toLocaleDateString()}
            </Typography>
          )}
        </Paper>

        {isExpired && (
          <Alert severity="error" sx={{ mb: 4 }}>
            This contract has expired and can no longer be signed. Please contact the festival organizers.
          </Alert>
        )}

        {!isExpired && (
          <>
            {/* Contract Content */}
            <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Contract Terms and Conditions
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ maxHeight: '500px', overflow: 'auto', mb: 3 }}>
                {formatContent(contract.content)}
              </Box>
            </Paper>

            {/* Signing Section */}
            <Paper elevation={2} sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                Electronic Signature
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body1">
                    I, {contract.artist_name}, have read and agree to the terms and conditions outlined in this Performance Agreement. 
                    I understand that by checking this box and clicking "Sign Contract", I am providing my electronic signature 
                    which has the same legal effect as a handwritten signature.
                  </Typography>
                }
                sx={{ mb: 3, alignItems: 'flex-start' }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSign}
                  disabled={!agreed || signing}
                  startIcon={signing ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ minWidth: 200 }}
                >
                  {signing ? 'Signing...' : 'Sign Contract'}
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                By signing this contract electronically, you acknowledge that you have read, understood, and agree to all terms and conditions.
              </Typography>
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
};

export default ContractSigning;