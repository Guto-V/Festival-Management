import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  GetApp,
  PictureAsPdf,
  TableChart,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { useFestival } from '../contexts/FestivalContext';

interface Performance {
  id: number;
  artist_id: number;
  artist_name: string;
  stage_area_id: number;
  stage_area_name: string;
  performance_date: string;
  start_time: string;
  duration_minutes: number;
  setup_time: number;
  status: string;
}

interface StageArea {
  id: number;
  name: string;
  type: string;
  sort_order?: number;
}


const Timetable: React.FC = () => {
  const { currentFestival } = useFestival();
  const navigate = useNavigate();
  const { eventId } = useParams();
  
  const [stageAreas, setStageAreas] = useState<StageArea[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [festivalDates, setFestivalDates] = useState<Dayjs[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (currentFestival) {
      initializeFestivalDates();
      fetchStageAreas();
      fetchPerformances();
    }
  }, [currentFestival]);

  useEffect(() => {
    if (festivalDates.length > 0) {
      fetchPerformances();
    }
  }, [selectedDayIndex, festivalDates]);

  const initializeFestivalDates = () => {
    if (!currentFestival) return;
    
    const startDate = dayjs(currentFestival.start_date);
    const endDate = dayjs(currentFestival.end_date);
    const dates = [];
    
    let currentDate = startDate;
    while (currentDate.isSame(endDate, 'day') || currentDate.isBefore(endDate, 'day')) {
      dates.push(currentDate);
      currentDate = currentDate.add(1, 'day');
    }
    
    setFestivalDates(dates);
  };

  const fetchStageAreas = async () => {
    try {
      const response = await axios.get(`/api/stages-areas?event_id=${currentFestival?.id}`);
      // Sort stage areas by sort_order, then by name
      const sortedStageAreas = response.data.sort((a: StageArea, b: StageArea) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order;
        }
        if (a.sort_order !== undefined) return -1;
        if (b.sort_order !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
      setStageAreas(sortedStageAreas);
    } catch (error) {
      console.error('Failed to fetch stage areas:', error);
      setError('Failed to load stage areas');
    }
  };

  const fetchPerformances = async () => {
    if (!currentFestival || festivalDates.length === 0) return;
    
    try {
      setLoading(true);
      const selectedDate = festivalDates[selectedDayIndex];
      const dateStr = selectedDate.format('YYYY-MM-DD');
      
      const response = await axios.get(`/api/schedule?festival_id=${currentFestival.id}`);
      
      // Filter performances by selected date
      const filteredPerformances = response.data.filter((performance: Performance) => 
        performance.performance_date === dateStr
      );
      
      setPerformances(filteredPerformances);
    } catch (error) {
      console.error('Failed to fetch performances:', error);
      setError('Failed to load performances');
    } finally {
      setLoading(false);
    }
  };

  const getPerformancesForStage = (stageAreaId: number): Performance[] => {
    return performances
      .filter(performance => performance.stage_area_id === stageAreaId)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadAnchor(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchor(null);
  };

  const downloadCSV = () => {
    const selectedDate = festivalDates[selectedDayIndex];
    const dateStr = selectedDate.format('YYYY-MM-DD');
    
    // Create CSV headers
    const headers = ['Stage/Area', 'Start Time', 'Artist', 'Duration'];
    const csvContent = [headers.join(',')];
    
    // Add data for each stage
    stageAreas.forEach(stage => {
      const stagePerformances = getPerformancesForStage(stage.id);
      
      if (stagePerformances.length === 0) {
        csvContent.push(`"${stage.name}","","No performances scheduled",""`);
      } else {
        stagePerformances.forEach(performance => {
          csvContent.push(`"${stage.name}","${performance.start_time}","${performance.artist_name}","${formatDuration(performance.duration_minutes)}"`);
        });
      }
    });
    
    // Download the CSV
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentFestival?.name}_timetable_${dateStr}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    handleDownloadClose();
  };

  const downloadPDF = () => {
    const selectedDate = festivalDates[selectedDayIndex];
    const dateStr = selectedDate.format('DD/MM/YYYY');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let tableHTML = `
      <html>
        <head>
          <title>${currentFestival?.name} Timetable - ${dateStr}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976d2; margin-bottom: 10px; }
            h2 { color: #424242; margin-bottom: 20px; }
            .stage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
            .stage-column { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
            .stage-header { background-color: #1976d2; color: white; padding: 12px; font-weight: bold; text-align: center; }
            .performance-item { padding: 8px 12px; border-bottom: 1px solid #eee; }
            .performance-item:last-child { border-bottom: none; }
            .performance-time { font-weight: bold; color: #1976d2; }
            .performance-artist { margin-top: 2px; }
            .no-performances { padding: 12px; text-align: center; color: #666; font-style: italic; }
            @media print { body { margin: 0; } .stage-grid { grid-template-columns: repeat(3, 1fr); } }
          </style>
        </head>
        <body>
          <h1>${currentFestival?.name}</h1>
          <h2>Timetable - ${dateStr}</h2>
          <div class="stage-grid">
    `;
    
    stageAreas.forEach(stage => {
      const stagePerformances = getPerformancesForStage(stage.id);
      
      tableHTML += `
        <div class="stage-column">
          <div class="stage-header">${stage.name}</div>
      `;
      
      if (stagePerformances.length === 0) {
        tableHTML += '<div class="no-performances">No performances scheduled</div>';
      } else {
        stagePerformances.forEach(performance => {
          tableHTML += `
            <div class="performance-item">
              <div class="performance-time">${performance.start_time}</div>
              <div class="performance-artist">${performance.artist_name}</div>
            </div>
          `;
        });
      }
      
      tableHTML += '</div>';
    });
    
    tableHTML += `
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(tableHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    handleDownloadClose();
  };

  if (!currentFestival) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No event selected. Please go back to the system dashboard and select an event.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading timetable...</Typography>
      </Box>
    );
  }

  const selectedDate = festivalDates[selectedDayIndex];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Event Timetable</Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={handleDownloadClick}
        >
          Download
        </Button>
        
        <Menu
          anchorEl={downloadAnchor}
          open={Boolean(downloadAnchor)}
          onClose={handleDownloadClose}
        >
          <MenuItem onClick={downloadPDF}>
            <ListItemIcon>
              <PictureAsPdf fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={downloadCSV}>
            <ListItemIcon>
              <TableChart fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download CSV</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Festival Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {currentFestival.name} {currentFestival.year}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentFestival.location}
          </Typography>
        </CardContent>
      </Card>

      {/* Date Tabs */}
      {festivalDates.length > 1 && (
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={selectedDayIndex} 
            onChange={(e, newValue) => setSelectedDayIndex(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {festivalDates.map((date, index) => (
              <Tab
                key={index}
                label={date.format('dddd, DD MMM')}
                sx={{ textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Timetable */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {selectedDate ? selectedDate.format('dddd, DD MMMM YYYY') : 'Timetable'}
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(auto-fit, minmax(300px, 1fr))' 
        }, 
        gap: 3 
      }}>
        {stageAreas.map(stage => {
          const stagePerformances = getPerformancesForStage(stage.id);
          
          return (
            <Card key={stage.id}>
              <CardContent>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2,
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: '8px 8px 0 0',
                    textAlign: 'center',
                    mx: -2,
                    mt: -2
                  }}
                >
                  {stage.name}
                </Typography>
                
                {stagePerformances.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}>
                    No performances scheduled
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {stagePerformances.map(performance => (
                      <Typography 
                        key={performance.id}
                        variant="body1"
                        sx={{ py: 0.5 }}
                      >
                        {performance.start_time} - {performance.artist_name}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default Timetable;