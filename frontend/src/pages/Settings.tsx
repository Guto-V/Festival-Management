import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { useFestival } from '../contexts/FestivalContext';

// Set dayjs to use UK locale
dayjs.locale('en-gb');

const Settings: React.FC = () => {
  const { currentFestival, updateFestival } = useFestival();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: currentFestival?.name || '',
    start_date: currentFestival ? dayjs(currentFestival.start_date) : dayjs() as Dayjs | null,
    end_date: currentFestival ? dayjs(currentFestival.end_date) : dayjs() as Dayjs | null,
    location: currentFestival?.location || '',
    description: currentFestival?.description || '',
    status: currentFestival?.status || 'planning' as 'planning' | 'active' | 'completed' | 'cancelled',
    budget_total: currentFestival?.budget_total?.toString() || '0',
    // Event timing settings
    event_start_time: currentFestival?.event_start_time || '09:00',
    event_end_time: currentFestival?.event_end_time || '23:00',
    use_custom_daily_times: currentFestival?.use_custom_daily_times || false,
    daily_times: currentFestival?.daily_times ? 
      (typeof currentFestival.daily_times === 'string' ? 
        JSON.parse(currentFestival.daily_times) : 
        currentFestival.daily_times) : 
      [] as Array<{ date: string; start_time: string; end_time: string }>,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const generateDailyTimes = () => {
    if (!formData.start_date || !formData.end_date) return [];
    
    const dailyTimes = [];
    let currentDate = formData.start_date.clone();
    
    while (currentDate.isSame(formData.end_date) || currentDate.isBefore(formData.end_date)) {
      dailyTimes.push({
        date: currentDate.format('YYYY-MM-DD'),
        start_time: formData.event_start_time,
        end_time: formData.event_end_time,
      });
      currentDate = currentDate.add(1, 'day');
    }
    
    return dailyTimes;
  };

  const handleSubmit = async () => {
    if (!currentFestival) return;
    
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      setError('Event name, start date, and end date are required');
      return;
    }

    if (formData.end_date.isBefore(formData.start_date)) {
      setError('End date must be after start date');
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.event_start_time) || !timeRegex.test(formData.event_end_time)) {
      setError('Please enter valid times in HH:MM format');
      return;
    }

    // Validate budget
    const budgetValue = parseFloat(formData.budget_total) || 0;
    if (budgetValue < 0) {
      setError('Budget cannot be negative');
      return;
    }

    // Validate dates are not in the past (except for historical events)
    if (formData.start_date.isBefore(dayjs().subtract(1, 'year'))) {
      setError('Event start date seems too far in the past. Please verify the date.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        name: formData.name,
        start_date: formData.start_date.format('YYYY-MM-DD'),
        end_date: formData.end_date.format('YYYY-MM-DD'),
        location: formData.location,
        description: formData.description,
        status: formData.status,
        budget_total: parseFloat(formData.budget_total) || 0,
        event_start_time: formData.event_start_time,
        event_end_time: formData.event_end_time,
        use_custom_daily_times: formData.use_custom_daily_times,
        daily_times: formData.use_custom_daily_times ? formData.daily_times : null,
      };

      await updateFestival(currentFestival.id, data);
      setSuccess('Event settings updated successfully!');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update event settings');
    } finally {
      setLoading(false);
    }
  };

  if (!currentFestival) {
    return (
      <Alert severity="warning">
        No event selected. Please go back to the system dashboard and select an event.
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box>
        <Typography variant="h4" gutterBottom>
          Event Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Update event details and configuration
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Event Information
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ display: 'grid', gap: 3, mt: 2 }}>
              <TextField
                label="Event Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(newValue) => setFormData({ ...formData, start_date: newValue })}
                  slotProps={{ textField: { required: true, fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                  slotProps={{ textField: { required: true, fullWidth: true } }}
                />
              </Box>

              <TextField
                label="Location Details"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Additional location information"
                fullWidth
                helperText="Optional: Specify room, hall, or area within the venue"
              />

              <TextField
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    label="Status"
                  >
                    <MenuItem value="planning">Planning</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Total Budget"
                  type="number"
                  value={formData.budget_total}
                  onChange={(e) => setFormData({ ...formData, budget_total: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: '£' }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Event Timing
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Event Start Time"
                  type="time"
                  value={formData.event_start_time}
                  onChange={(e) => setFormData({ ...formData, event_start_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  helperText="Daily start time for the event"
                />
                <TextField
                  label="Event End Time"
                  type="time"
                  value={formData.event_end_time}
                  onChange={(e) => setFormData({ ...formData, event_end_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  helperText="Daily end time for the event"
                />
              </Box>
              
              {/* Multi-day custom times - only show if event spans multiple days */}
              {formData.start_date && formData.end_date && !formData.start_date.isSame(formData.end_date, 'day') && (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.use_custom_daily_times}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({ 
                            ...formData, 
                            use_custom_daily_times: checked,
                            daily_times: checked ? generateDailyTimes() : []
                          });
                        }}
                      />
                    }
                    label="Use custom times for each day"
                  />
                  
                  {formData.use_custom_daily_times && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Custom Daily Times
                      </Typography>
                      {formData.daily_times.map((dayTime: { date: string; start_time: string; end_time: string }, index: number) => (
                        <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                          <TextField
                            label={`Day ${index + 1} (${dayjs(dayTime.date).format('MMM D')})`}
                            value={dayjs(dayTime.date).format('dddd, MMM D')}
                            disabled
                            size="small"
                          />
                          <TextField
                            label="Start Time"
                            type="time"
                            value={dayTime.start_time}
                            onChange={(e) => {
                              const newDailyTimes = [...formData.daily_times];
                              newDailyTimes[index].start_time = e.target.value;
                              setFormData({ ...formData, daily_times: newDailyTimes });
                            }}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                          />
                          <TextField
                            label="End Time"
                            type="time"
                            value={dayTime.end_time}
                            onChange={(e) => {
                              const newDailyTimes = [...formData.daily_times];
                              newDailyTimes[index].end_time = e.target.value;
                              setFormData({ ...formData, daily_times: newDailyTimes });
                            }}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Event Details
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Current Dates:</Typography>
                <Typography variant="body1">
                  {formatDate(currentFestival.start_date)} - {formatDate(currentFestival.end_date)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {currentFestival.status}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Budget:</Typography>
                <Typography variant="body1">
                  £{currentFestival.budget_total?.toLocaleString() || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default Settings;