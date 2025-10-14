import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { Person, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface VolunteerApplication {
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
}

interface RegistrationConfig {
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
  welcomeTitle: string;
  welcomeDescription: string;
  confirmationTitle: string;
  confirmationMessage: string;
  inductionEnabled: boolean;
  inductionTitle: string;
  inductionContent: string;
}

const VolunteerRegistration: React.FC = () => {
  const { currentFestival } = useFestival();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<VolunteerApplication>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    experience: '',
    availability: '',
    inductionCompleted: false,
  });
  const [config, setConfig] = useState<RegistrationConfig>({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const steps = config.inductionEnabled ? ['Your Details', 'Induction Information', 'Confirmation'] : ['Your Details', 'Confirmation'];

  useEffect(() => {
    fetchConfiguration();
  }, []);

  // Get festival ID for submission - use current festival or default to 1
  const getFestivalId = () => {
    if (currentFestival?.id) {
      return currentFestival.id;
    }
    // Fallback to festival ID 1 if no current festival (for public access)
    console.warn('No current festival found, using default festival ID 1');
    return 1;
  };

  const fetchConfiguration = async () => {
    try {
      const savedConfig = localStorage.getItem('volunteerRegistrationConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Failed to load registration configuration from localStorage, using defaults:', error);
      // Keep default config if loading fails
    }
  };

  const handleInputChange = (field: keyof VolunteerApplication, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        // Check required fields based on configuration
        const requiredFields = Object.entries(config.fields)
          .filter(([_, fieldConfig]) => fieldConfig.enabled && fieldConfig.required)
          .map(([fieldName, _]) => fieldName as keyof VolunteerApplication);
        
        return requiredFields.every(fieldName => {
          const value = formData[fieldName];
          return typeof value === 'string' ? value.trim() !== '' : Boolean(value);
        });
      case 1:
        return config.inductionEnabled ? formData.inductionCompleted : true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      let nextStep = activeStep + 1;
      // Skip induction step if disabled
      if (nextStep === 1 && !config.inductionEnabled) {
        nextStep = 2;
      }
      setActiveStep(nextStep);
      setError('');
    } else {
      setError('Please complete all required fields before continuing.');
    }
  };

  const handleBack = () => {
    let prevStep = activeStep - 1;
    // Skip induction step if disabled and going back from confirmation
    if (prevStep === 1 && !config.inductionEnabled) {
      prevStep = 0;
    }
    setActiveStep(prevStep);
    setError('');
  };

  const handleSubmit = async () => {
    // Validate all required fields
    if (!validateStep(0)) {
      setError('Please complete all required fields.');
      return;
    }
    
    // Validate induction if enabled
    if (config.inductionEnabled && !formData.inductionCompleted) {
      setError('Please confirm that you have read and understood the induction information.');
      return;
    }


    setLoading(true);
    try {
      // Prepare data for API submission
      const applicationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        experience: formData.experience,
        availability: formData.availability,
        inductionCompleted: formData.inductionCompleted,
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
        festival_id: getFestivalId()
      };

      console.log('Submitting volunteer application:', applicationData);
      await axios.post('/api/volunteer-registration', applicationData);
      
      setSuccess(true);
      setError('');
    } catch (error: any) {
      console.error('Failed to submit volunteer application:', error);
      setError(error.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            
            {/* Name Fields */}
            {(config.fields.firstName.enabled || config.fields.lastName.enabled) && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {config.fields.firstName.enabled && (
                  <TextField
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required={config.fields.firstName.required}
                    fullWidth
                  />
                )}
                {config.fields.lastName.enabled && (
                  <TextField
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required={config.fields.lastName.required}
                    fullWidth
                  />
                )}
              </Box>
            )}
            
            {/* Contact Fields */}
            {(config.fields.email.enabled || config.fields.phone.enabled) && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {config.fields.email.enabled && (
                  <TextField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required={config.fields.email.required}
                    fullWidth
                  />
                )}
                {config.fields.phone.enabled && (
                  <TextField
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required={config.fields.phone.required}
                    fullWidth
                  />
                )}
              </Box>
            )}
            
            {/* Address Field */}
            {config.fields.address.enabled && (
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required={config.fields.address.required}
                multiline
                rows={2}
                fullWidth
              />
            )}
            
            {/* Emergency Contact Section */}
            {(config.fields.emergencyContact.enabled || config.fields.emergencyPhone.enabled) && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Emergency Contact
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {config.fields.emergencyContact.enabled && (
                    <TextField
                      label="Emergency Contact Name"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      required={config.fields.emergencyContact.required}
                      fullWidth
                    />
                  )}
                  {config.fields.emergencyPhone.enabled && (
                    <TextField
                      label="Emergency Contact Phone"
                      value={formData.emergencyPhone}
                      onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                      required={config.fields.emergencyPhone.required}
                      fullWidth
                    />
                  )}
                </Box>
              </>
            )}
            
            {/* Experience Field */}
            {config.fields.experience.enabled && (
              <TextField
                label={`Previous Volunteer Experience${config.fields.experience.required ? '' : ' (Optional)'}`}
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                required={config.fields.experience.required}
                multiline
                rows={3}
                fullWidth
                placeholder="Tell us about any previous volunteer experience you have..."
              />
            )}
            
            {/* Availability Field */}
            {config.fields.availability.enabled && (
              <TextField
                label={`Availability${config.fields.availability.required ? '' : ' (Optional)'}`}
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                required={config.fields.availability.required}
                multiline
                rows={2}
                fullWidth
                placeholder="When are you available to volunteer? (e.g., weekends, specific days, times)"
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography variant="h6" gutterBottom>
              {config.inductionTitle}
            </Typography>
            <Paper sx={{ p: 3, bgcolor: 'grey.50', maxHeight: '400px', overflow: 'auto' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {config.inductionContent}
              </Typography>
            </Paper>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.inductionCompleted}
                  onChange={(e) => handleInputChange('inductionCompleted', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body1">
                  I have read and understood the induction information above
                </Typography>
              }
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'grid', gap: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mx: 'auto' }} />
            <Typography variant="h5" gutterBottom>
              Application Summary
            </Typography>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {formData.firstName} {formData.lastName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {formData.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Phone:</strong> {formData.phone}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Induction Completed:</strong> {formData.inductionCompleted ? 'Yes' : 'No'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Please review your information and click "Submit Application" to complete your volunteer registration.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="success.main">
              {config.confirmationTitle}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {config.confirmationMessage}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We will contact you via email once your application has been reviewed.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      py: 4,
      px: 2
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Person sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h3" color="primary.main">
                {config.welcomeTitle}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              {config.welcomeDescription}
            </Typography>
          </CardContent>
        </Card>

        {/* Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            {renderStepContent(activeStep)}

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                variant="outlined"
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !validateStep(0) || (config.inductionEnabled && !formData.inductionCompleted)}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!validateStep(activeStep)}
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default VolunteerRegistration;