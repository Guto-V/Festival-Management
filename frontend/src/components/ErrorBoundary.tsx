import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import { Refresh, Home } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/system';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3,
          backgroundColor: '#f5f5f5'
        }}>
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Oops! Something went wrong
                </Typography>
                <Typography variant="body2">
                  The application encountered an unexpected error. This has been logged and our team will investigate.
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Error: {this.state.error?.message}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                >
                  Go to Dashboard
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Debug Information (Development Only):
                  </Typography>
                  <Typography variant="caption" component="pre" sx={{ fontSize: 11, overflow: 'auto' }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;