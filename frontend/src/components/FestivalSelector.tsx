import React, { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Event,
  Settings,
  Add,
} from '@mui/icons-material';
import { useFestival } from '../contexts/FestivalContext';

interface FestivalSelectorProps {
  onManageClick?: () => void;
  showManageButton?: boolean;
  compact?: boolean;
}

const FestivalSelector: React.FC<FestivalSelectorProps> = ({ 
  onManageClick, 
  showManageButton = true,
  compact = false 
}) => {
  const { currentFestival, festivals, loading, switchFestival } = useFestival();
  const [switching, setSwitching] = useState(false);

  const handleFestivalChange = async (festivalId: number) => {
    if (festivalId === currentFestival?.id) return;
    
    setSwitching(true);
    try {
      switchFestival(festivalId);
      // Small delay to show visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setSwitching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'primary';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🎪';
      case 'planning': return '📋';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ color: compact ? 'inherit' : 'textPrimary' }}>
          Loading festivals...
        </Typography>
      </Box>
    );
  }

  if (switching) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ color: compact ? 'inherit' : 'textPrimary' }}>
          Switching festival...
        </Typography>
      </Box>
    );
  }

  if (festivals.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="textSecondary">
          No festivals available
        </Typography>
        {showManageButton && onManageClick && (
          <Tooltip title="Add Festival">
            <IconButton size="small" onClick={onManageClick} color="primary">
              <Add />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Event fontSize="small" sx={{ color: 'inherit' }} />
        <FormControl size="small" variant="outlined" sx={{ minWidth: 220 }}>
          <Select
            value={currentFestival?.id || ''}
            onChange={(e) => handleFestivalChange(Number(e.target.value))}
            displayEmpty
            disabled={switching}
            sx={{
              color: 'inherit',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.7)',
              },
              '& .MuiSelect-icon': {
                color: 'inherit',
              },
            }}
          >
            {festivals.map((festival) => (
              <MenuItem 
                key={festival.id} 
                value={festival.id}
                sx={{
                  bgcolor: festival.id === currentFestival?.id ? 'primary.light' : 'transparent',
                  '&:hover': {
                    bgcolor: festival.id === currentFestival?.id ? 'primary.main' : 'action.hover',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <span>{getStatusIcon(festival.status)}</span>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: festival.id === currentFestival?.id ? 'bold' : 'normal' }}>
                      {festival.name} {festival.year}
                    </Typography>
                    {festival.location && (
                      <Typography variant="caption" color="textSecondary">
                        📍 {festival.location}
                      </Typography>
                    )}
                  </Box>
                  {festival.id === currentFestival?.id && (
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      ACTIVE
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {showManageButton && onManageClick && (
          <Tooltip title="Manage Festivals">
            <IconButton size="small" onClick={onManageClick} sx={{ color: 'inherit' }}>
              <Settings />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Event color="primary" />
        <FormControl variant="outlined" sx={{ minWidth: 250 }}>
          <InputLabel>Current Festival</InputLabel>
          <Select
            value={currentFestival?.id || ''}
            onChange={(e) => handleFestivalChange(Number(e.target.value))}
            label="Current Festival"
            displayEmpty
            disabled={switching}
          >
            {festivals.map((festival) => (
              <MenuItem key={festival.id} value={festival.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{getStatusIcon(festival.status)}</span>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {festival.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {festival.year} • {new Date(festival.start_date).toLocaleDateString()} - {new Date(festival.end_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={festival.status} 
                    size="small" 
                    color={getStatusColor(festival.status)} 
                    variant="outlined"
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {currentFestival && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={currentFestival.status}
            size="small"
            color={getStatusColor(currentFestival.status)}
            icon={<span>{getStatusIcon(currentFestival.status)}</span>}
          />
          {currentFestival.location && (
            <Typography variant="caption" color="textSecondary">
              📍 {currentFestival.location}
            </Typography>
          )}
        </Box>
      )}

      {showManageButton && onManageClick && (
        <Tooltip title="Manage Festivals">
          <IconButton onClick={onManageClick} color="primary">
            <Settings />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default FestivalSelector;