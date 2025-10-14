import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Edit,
  Delete,
  GetApp,
  DragIndicator,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';
import { useNavigate, useParams } from 'react-router-dom';

// Set dayjs to use UK locale
dayjs.locale('en-gb');
// import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Artist {
  id: number;
  name: string;
  status: string;
}

interface StageArea {
  id: number;
  name: string;
  type: string;
  sort_order?: number;
}

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
  start_minutes: number;
  end_minutes: number;
  time_blocks: number;
}

interface TimeSlot {
  time: string;
  minutes: number;
  slot_index: number;
}

const Schedule: React.FC = () => {
  const { currentFestival } = useFestival();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [festivalDates, setFestivalDates] = useState<Dayjs[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [stageAreas, setStageAreas] = useState<StageArea[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    artist_id: '',
    stage_area_id: '',
    start_time: '',
    duration_minutes: 30,
    setup_time: 15,
    notes: '',
  });

  useEffect(() => {
    if (currentFestival) {
      fetchStageAreas();
    }
  }, [currentFestival]);

  useEffect(() => {
    if (currentFestival) {
      fetchArtists();
    }
  }, [currentFestival]);

  useEffect(() => {
    if (currentFestival) {
      // Generate array of event dates
      const startDate = dayjs(currentFestival.start_date);
      const endDate = dayjs(currentFestival.end_date);
      const dates: Dayjs[] = [];
      
      let currentDate = startDate;
      while (currentDate.isSame(endDate) || currentDate.isBefore(endDate)) {
        dates.push(currentDate);
        currentDate = currentDate.add(1, 'day');
      }
      
      setFestivalDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        setSelectedDayIndex(0);
      }
    }
  }, [currentFestival]);

  useEffect(() => {
    if (selectedDate) {
      fetchScheduleGrid();
    }
  }, [selectedDate]);

  // Auto-dismiss error notifications after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchStageAreas = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/stages-areas?event_id=${currentFestival.id}`);
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
      setError('Failed to fetch stages and areas');
    }
  };

  const fetchArtists = async () => {
    if (!currentFestival) return;
    
    try {
      const response = await axios.get(`/api/artists?festival_id=${currentFestival.id}`);
      setArtists(response.data);
    } catch (error) {
      setError('Failed to fetch artists');
    }
  };

  const fetchScheduleGrid = async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await axios.get(`/api/schedule/grid/${dateStr}?festival_id=${currentFestival?.id}&event_id=${currentFestival?.id}`);
      const { time_slots, performances } = response.data;
      setTimeSlots(time_slots);
      setPerformances(performances);
    } catch (error) {
      setError('Failed to fetch schedule');
    }
  };

  const handleOpen = (performance?: Performance) => {
    if (performance) {
      setEditingPerformance(performance);
      setFormData({
        artist_id: performance.artist_id.toString(),
        stage_area_id: performance.stage_area_id.toString(),
        start_time: performance.start_time,
        duration_minutes: performance.duration_minutes,
        setup_time: performance.setup_time,
        notes: '',
      });
    } else {
      setEditingPerformance(null);
      setFormData({
        artist_id: '',
        stage_area_id: '',
        start_time: '',
        duration_minutes: 30,
        setup_time: 15,
        notes: '',
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPerformance(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!currentFestival) {
      setError('No event selected');
      return;
    }
    
    const missingFields = [];
    if (!formData.artist_id || formData.artist_id === '' || formData.artist_id === '0') {
      missingFields.push('Artist');
    }
    if (!formData.stage_area_id || formData.stage_area_id === '' || formData.stage_area_id === '0') {
      missingFields.push('Stage/Area');
    }
    if (!formData.start_time || formData.start_time === '' || formData.start_time.trim() === '') {
      missingFields.push('Start time');
    }
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.start_time)) {
      setError('Please enter a valid time in HH:MM format');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        performance_date: selectedDate.format('YYYY-MM-DD'),
        artist_id: parseInt(formData.artist_id),
        stage_area_id: parseInt(formData.stage_area_id),
        festival_id: currentFestival.id,
      };

      if (editingPerformance) {
        await axios.put(`/api/schedule/performance/${editingPerformance.id}`, data);
      } else {
        await axios.post('/api/schedule/performance', data);
      }

      fetchScheduleGrid();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save performance');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this performance?')) {
      try {
        await axios.delete(`/api/schedule/performance/${id}`);
        fetchScheduleGrid();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete performance');
      }
    }
  };

  const [draggedPerformance, setDraggedPerformance] = useState<Performance | null>(null);
  const [dragPreview, setDragPreview] = useState<{ show: boolean; time: string; x: number; y: number; snapY: number; stageAreaId: number | null }>({
    show: false,
    time: '',
    x: 0,
    y: 0,
    snapY: 0,
    stageAreaId: null
  });
  const [dragPosition, setDragPosition] = useState<{ stageAreaId: number | null; snapY: number }>({
    stageAreaId: null,
    snapY: 0
  });
  const [lastDragPosition, setLastDragPosition] = useState<number>(0);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [setupTimeEdit, setSetupTimeEdit] = useState<{ show: boolean; performanceId: number; currentTime: number }>({
    show: false,
    performanceId: 0,
    currentTime: 0
  });

  const handleDragStart = (e: React.DragEvent, performance: Performance) => {
    setDraggedPerformance(performance);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', performance.id.toString());
    
    // Initialize last drag position to the performance's current position
    const eventStartTime = currentFestival?.event_start_time || '09:00';
    const [startHours] = eventStartTime.split(':').map(Number);
    const currentRelativePosition = performance.start_minutes - (startHours * 60);
    setLastDragPosition(currentRelativePosition);
    
    // Create a transparent drag image to eliminate browser's default drag visual
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, stageAreaId: number) => {
    e.preventDefault();
    if (!draggedPerformance) return;

    // Get mouse position relative to the stage column
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    const pixelsPerMinute = 2;
    const eventStartTime = currentFestival?.event_start_time || '09:00';
    const [startHours] = eventStartTime.split(':').map(Number);
    
    // Adjust y position to center the mouse cursor in the block
    const blockHeight = draggedPerformance.duration_minutes * pixelsPerMinute;
    const adjustedY = y - (blockHeight / 2);
    
    // Calculate minutes from top of timeline (no offset adjustments)
    const totalMinutes = Math.max(0, adjustedY / pixelsPerMinute);
    
    // Physical collision detection - include setup times
    const draggedDurationWithSetup = draggedPerformance.duration_minutes + draggedPerformance.setup_time;
    const blockingPerformances = performances
      .filter(p => p.stage_area_id === stageAreaId && p.id !== draggedPerformance.id)
      .map(p => {
        // Convert absolute minutes to relative minutes (same coordinate system as totalMinutes)
        const perfStartRelative = p.start_minutes - (startHours * 60);
        const perfEndRelative = p.end_minutes - (startHours * 60);
        
        // Setup time appears ABOVE the performance, so it starts before the performance
        const setupStartRelative = perfStartRelative - p.setup_time;
        const totalEndRelative = perfEndRelative; // Performance end (setup doesn't extend after)
        
        return {
          setupStartMinutes: setupStartRelative,
          performanceStartMinutes: perfStartRelative,
          performanceEndMinutes: perfEndRelative,
          totalStartMinutes: setupStartRelative, // Total block starts with setup
          totalEndMinutes: totalEndRelative     // Total block ends with performance
        };
      })
      .sort((a, b) => a.totalStartMinutes - b.totalStartMinutes);
    
    // Use exact mouse position for collision detection
    let collisionAdjustedMinutes = totalMinutes;
    
    // Find the closest blocking performance that would cause a collision
    for (const blockingPerf of blockingPerformances) {
      // Calculate where the dragged block would be positioned (including setup)
      const draggedSetupStart = collisionAdjustedMinutes - draggedPerformance.setup_time;
      const draggedPerformanceEnd = collisionAdjustedMinutes + draggedPerformance.duration_minutes;
      
      // Check if there would be a collision
      const hasCollision = draggedSetupStart < blockingPerf.totalEndMinutes && 
                          draggedPerformanceEnd > blockingPerf.totalStartMinutes;
      
      if (hasCollision) {
        // Determine if mouse has moved completely past the blocking performance
        const mouseSetupStart = totalMinutes - draggedPerformance.setup_time;
        const mousePassedBlock = mouseSetupStart >= blockingPerf.totalEndMinutes;
        
        if (mousePassedBlock) {
          // Mouse is past the block - allow jump through
          collisionAdjustedMinutes = blockingPerf.totalEndMinutes + draggedPerformance.setup_time;
        } else {
          // Mouse hasn't passed the block - determine where to stop based on current movement direction
          const isMovingDown = totalMinutes > lastDragPosition;
          
          if (isMovingDown) {
            // Moving down: stop so dragged block touches but doesn't overlap blocking block
            collisionAdjustedMinutes = blockingPerf.totalStartMinutes + draggedPerformance.setup_time - draggedPerformance.duration_minutes;
            // Ensure we don't go negative
            if (collisionAdjustedMinutes < draggedPerformance.setup_time) {
              collisionAdjustedMinutes = draggedPerformance.setup_time;
            }
          } else {
            // Moving up: stop after the blocking block
            collisionAdjustedMinutes = blockingPerf.totalEndMinutes + draggedPerformance.setup_time;
          }
        }
        break; // Only handle the first collision
      }
    }
    
    // Only NOW apply 5-minute snapping to the collision-resolved position
    const snappedMinutes = Math.round(collisionAdjustedMinutes / 5) * 5;
    
    // Calculate actual time
    const startMinutesFromMidnight = startHours * 60;
    const newStartMinutes = startMinutesFromMidnight + snappedMinutes;
    
    const hours = Math.floor(newStartMinutes / 60);
    const minutes = newStartMinutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Calculate snapped Y position relative to the timeline
    const snapPosition = snappedMinutes * pixelsPerMinute;
    
    setDragPreview({
      show: true,
      time: timeString,
      x: e.clientX,
      y: e.clientY,
      snapY: snapPosition,
      stageAreaId: stageAreaId
    });
    
    setDragPosition({
      stageAreaId: stageAreaId,
      snapY: snapPosition
    });
    
    // Update last drag position for direction detection
    setLastDragPosition(totalMinutes);
  };

  const handleDrop = async (e: React.DragEvent, stageAreaId: number) => {
    e.preventDefault();
    setDragPreview({ show: false, time: '', x: 0, y: 0, snapY: 0, stageAreaId: null });
    setDragPosition({ stageAreaId: null, snapY: 0 });
    
    if (!draggedPerformance) return;

    // Get drop position - use same calculation as drag over
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    const pixelsPerMinute = 2;
    const eventStartTime = currentFestival?.event_start_time || '09:00';
    const [startHours] = eventStartTime.split(':').map(Number);
    
    // Adjust y position to center the mouse cursor in the block (same as drag over)
    const blockHeight = draggedPerformance.duration_minutes * pixelsPerMinute;
    const adjustedY = y - (blockHeight / 2);
    
    // Calculate minutes from top of timeline (no offset adjustments)
    const totalMinutes = Math.max(0, adjustedY / pixelsPerMinute);
    
    // Apply exact same collision logic as drag over - include setup times
    const draggedDurationWithSetup = draggedPerformance.duration_minutes + draggedPerformance.setup_time;
    const blockingPerformances = performances
      .filter(p => p.stage_area_id === stageAreaId && p.id !== draggedPerformance.id)
      .map(p => {
        // Convert absolute minutes to relative minutes (same coordinate system as totalMinutes)
        const perfStartRelative = p.start_minutes - (startHours * 60);
        const perfEndRelative = p.end_minutes - (startHours * 60);
        
        // Setup time appears ABOVE the performance, so it starts before the performance
        const setupStartRelative = perfStartRelative - p.setup_time;
        const totalEndRelative = perfEndRelative; // Performance end (setup doesn't extend after)
        
        return {
          setupStartMinutes: setupStartRelative,
          performanceStartMinutes: perfStartRelative,
          performanceEndMinutes: perfEndRelative,
          totalStartMinutes: setupStartRelative, // Total block starts with setup
          totalEndMinutes: totalEndRelative     // Total block ends with performance
        };
      })
      .sort((a, b) => a.totalStartMinutes - b.totalStartMinutes);
    
    // Use exact mouse position for collision detection
    let collisionAdjustedMinutes = totalMinutes;
    
    // Find the closest blocking performance that would cause a collision
    for (const blockingPerf of blockingPerformances) {
      // Calculate where the dragged block would be positioned (including setup)
      const draggedSetupStart = collisionAdjustedMinutes - draggedPerformance.setup_time;
      const draggedPerformanceEnd = collisionAdjustedMinutes + draggedPerformance.duration_minutes;
      
      // Check if there would be a collision
      const hasCollision = draggedSetupStart < blockingPerf.totalEndMinutes && 
                          draggedPerformanceEnd > blockingPerf.totalStartMinutes;
      
      if (hasCollision) {
        // Determine if mouse has moved completely past the blocking performance
        const mouseSetupStart = totalMinutes - draggedPerformance.setup_time;
        const mousePassedBlock = mouseSetupStart >= blockingPerf.totalEndMinutes;
        
        if (mousePassedBlock) {
          // Mouse is past the block - allow jump through
          collisionAdjustedMinutes = blockingPerf.totalEndMinutes + draggedPerformance.setup_time;
        } else {
          // Mouse hasn't passed the block - determine where to stop based on current movement direction
          const isMovingDown = totalMinutes > lastDragPosition;
          
          if (isMovingDown) {
            // Moving down: stop so dragged block touches but doesn't overlap blocking block
            collisionAdjustedMinutes = blockingPerf.totalStartMinutes + draggedPerformance.setup_time - draggedPerformance.duration_minutes;
            // Ensure we don't go negative
            if (collisionAdjustedMinutes < draggedPerformance.setup_time) {
              collisionAdjustedMinutes = draggedPerformance.setup_time;
            }
          } else {
            // Moving up: stop after the blocking block
            collisionAdjustedMinutes = blockingPerf.totalEndMinutes + draggedPerformance.setup_time;
          }
        }
        break; // Only handle the first collision
      }
    }
    
    // Only NOW apply 5-minute snapping to the collision-resolved position
    const snappedMinutes = Math.round(collisionAdjustedMinutes / 5) * 5;
    
    // Calculate actual time
    const startMinutesFromMidnight = startHours * 60;
    const newStartMinutes = startMinutesFromMidnight + snappedMinutes;
    
    const hours = Math.floor(newStartMinutes / 60);
    const minutes = newStartMinutes % 60;
    const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Check if this is actually a change
    if (stageAreaId === draggedPerformance.stage_area_id && newStartTime === draggedPerformance.start_time) {
      setDraggedPerformance(null);
      return;
    }

    try {
      await axios.put(`/api/schedule/performance/${draggedPerformance.id}`, {
        stage_area_id: stageAreaId,
        start_time: newStartTime,
        performance_date: selectedDate.format('YYYY-MM-DD')
      });
      fetchScheduleGrid();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to move performance');
    } finally {
      setDraggedPerformance(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedPerformance(null);
    setDragPreview({ show: false, time: '', x: 0, y: 0, snapY: 0, stageAreaId: null });
    setDragPosition({ stageAreaId: null, snapY: 0 });
    setLastDragPosition(0);
  };

  const handlePerformanceClick = (performance: Performance) => {
    if (!draggedPerformance) { // Only open details if not dragging
      setSelectedPerformance(performance);
    }
  };

  const handleSetupTimeClick = (performance: Performance) => {
    setSetupTimeEdit({
      show: true,
      performanceId: performance.id,
      currentTime: performance.setup_time
    });
  };

  const handleSetupTimeUpdate = async (newSetupTime: number) => {
    try {
      await axios.put(`/api/schedule/performance/${setupTimeEdit.performanceId}`, {
        setup_time: newSetupTime
      });
      fetchScheduleGrid();
      setSetupTimeEdit({ show: false, performanceId: 0, currentTime: 0 });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update setup time');
    }
  };



  const getPerformanceForSlot = (stageAreaId: number, slotMinutes: number): Performance | null => {
    return performances.find(p => 
      p.stage_area_id === stageAreaId && 
      slotMinutes >= p.start_minutes && 
      slotMinutes < p.end_minutes
    ) || null;
  };

  const renderProportionalTimeline = () => {
    if (stageAreas.length === 0) {
      return <Typography>Loading schedule...</Typography>;
    }

    // Timeline configuration - use event start/end times if available, otherwise default
    const eventStartTime = currentFestival?.event_start_time || '09:00';
    const eventEndTime = currentFestival?.event_end_time || '23:00';
    
    const [startHours, startMins] = eventStartTime.split(':').map(Number);
    const [endHours, endMins] = eventEndTime.split(':').map(Number);
    
    const startHour = startHours;
    const endHour = endHours; // Don't add extra hour
    const totalMinutes = (endHour - startHour) * 60 + endMins;
    const pixelsPerMinute = 2; // 2 pixels per minute for smooth scaling
    const timelineHeight = totalMinutes * pixelsPerMinute;
    
    // Debug logging
    console.log('Schedule calculation:', {
      eventStartTime,
      eventEndTime,
      startHour,
      endHour,
      endMins,
      totalMinutes,
      timelineHeight
    });
    
    // Generate time markers for every hour within the festival duration
    const timeMarkers = [];
    
    // Add hourly markers
    for (let hour = startHour; hour < endHour; hour++) {
      const relativeMinutes = (hour - startHour) * 60;
      const position = relativeMinutes * pixelsPerMinute;
      timeMarkers.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        position,
        relativeMinutes
      });
    }
    
    // Add final marker at the exact end time
    if (endMins > 0 || endHour === startHour) {
      const position = totalMinutes * pixelsPerMinute;
      timeMarkers.push({
        hour: endHour,
        time: `${endHour.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`,
        position,
        relativeMinutes: totalMinutes
      });
    } else {
      // If end time is exactly on the hour, add that hour marker
      const relativeMinutes = (endHour - startHour) * 60;
      const position = relativeMinutes * pixelsPerMinute;
      timeMarkers.push({
        hour: endHour,
        time: `${endHour.toString().padStart(2, '0')}:00`,
        position,
        relativeMinutes
      });
    }

    // Generate 5-minute snap positions
    const snapPositions: number[] = [];
    for (let minutes = 0; minutes < totalMinutes; minutes += 5) {
      snapPositions.push(minutes * pixelsPerMinute);
    }

    // Generate 15-minute background grid lines (faint)
    const gridLines: number[] = [];
    for (let minutes = 0; minutes < totalMinutes; minutes += 15) {
      gridLines.push(minutes * pixelsPerMinute);
    }

    return (
      <Box sx={{ 
        overflowX: 'auto', 
        overflowY: 'auto',
        maxHeight: '80vh',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        backgroundColor: '#fafafa'
      }}>
        <Box sx={{ minWidth: 800, position: 'relative' }}>
          {/* Header */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: `140px repeat(${stageAreas.length}, 1fr)`,
            position: 'sticky',
            top: 0,
            backgroundColor: '#fff',
            borderBottom: '2px solid #1976d2',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ p: 2, borderRight: '1px solid #e0e0e0' }}>
              <Typography variant="h6" fontWeight="bold" color="primary">Time</Typography>
            </Box>
            {stageAreas.map((stageArea, index) => (
              <Box key={stageArea.id} sx={{ p: 2, borderRight: '1px solid #e0e0e0', textAlign: 'center', position: 'relative' }}>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {stageArea.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stageArea.type}
                </Typography>
                
              </Box>
            ))}
          </Box>

          {/* Timeline Grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: `140px repeat(${stageAreas.length}, 1fr)`,
            height: timelineHeight,
            position: 'relative',
            marginTop: '8px' // Add small margin to prevent first time from being hidden
          }}>
            {/* Time Column */}
            <Box sx={{ 
              borderRight: '2px solid #ddd',
              position: 'relative',
              backgroundColor: '#f8f9fa',
              height: timelineHeight // Set exact height for time column too
            }}>
              {timeMarkers.map((marker) => (
                <Box
                  key={marker.hour}
                  sx={{
                    position: 'absolute',
                    top: marker.position,
                    left: 0,
                    right: 0,
                    height: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    pl: 2,
                    borderTop: '1px solid #ddd'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    color="primary"
                    sx={{ 
                      mt: -1, // Adjust to work with the new margin
                      backgroundColor: '#f8f9fa',
                      px: 0.5
                    }}
                  >
                    {marker.time}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Venue Columns */}
            {stageAreas.map(stageArea => (
              <Box 
                key={stageArea.id}
                onDragOver={(e) => handleDragOver(e, stageArea.id)}
                onDrop={(e) => handleDrop(e, stageArea.id)}
                sx={{ 
                  position: 'relative',
                  borderRight: '1px solid #e0e0e0',
                  backgroundColor: draggedPerformance ? 'rgba(25, 118, 210, 0.05)' : '#fff',
                  height: timelineHeight, // Use exact height instead of minHeight
                  overflow: 'hidden' // Prevent content from extending beyond the timeline
                }}
              >
                {/* Background grid lines (faint) */}
                {gridLines.map((position, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      top: position,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: index % 4 === 0 ? '#ddd' : '#f0f0f0',
                      opacity: index % 4 === 0 ? 0.3 : 0.15
                    }}
                  />
                ))}





                {/* Performance blocks */}
                {performances
                  .filter(p => {
                    // Show performance if it belongs to this stage area
                    if (p.stage_area_id === stageArea.id) return true;
                    // Also show the dragged performance in the target column
                    if (draggedPerformance?.id === p.id && dragPosition.stageAreaId === stageArea.id) return true;
                    return false;
                  })
                  .map((performance, index) => {
                    // Convert performance start time to minutes relative to event start - same calculation as drag
                    const [perfHours, perfMinutes] = performance.start_time.split(':').map(Number);
                    const totalPerfMinutes = perfHours * 60 + perfMinutes;
                    const relativeMinutes = totalPerfMinutes - (startHour * 60);
                    let topPosition = relativeMinutes * pixelsPerMinute; // No offset - use exact same calculation as drag
                    const height = performance.duration_minutes * pixelsPerMinute;
                    const setupHeight = performance.setup_time * pixelsPerMinute;
                    
                    const isDragging = draggedPerformance?.id === performance.id;
                    const isInOriginalColumn = performance.stage_area_id === stageArea.id;
                    const isInTargetColumn = dragPosition.stageAreaId === stageArea.id;
                    
                    // If this performance is being dragged and we're in the target column, use drag position
                    if (isDragging && isInTargetColumn) {
                      topPosition = dragPosition.snapY;
                    }
                    
                    // Hide the performance in its original column when dragging to a different column
                    const shouldHide = isDragging && isInOriginalColumn && dragPosition.stageAreaId !== null && dragPosition.stageAreaId !== stageArea.id;
                    
                    return (
                      <Box
                        key={performance.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, performance)}
                        onDragEnd={handleDragEnd}
                        sx={{
                          position: 'absolute',
                          top: topPosition,
                          left: 4,
                          right: 4,
                          zIndex: isDragging ? 1000 : 2,
                          opacity: shouldHide ? 0 : 1,
                          display: shouldHide ? 'none' : 'block',
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' }
                        }}
                      >
                            {/* Main performance block */}
                            <Card
                              onClick={() => handlePerformanceClick(performance)}
                              sx={{
                                height: height,
                                background: performance.artist_name === 'CHANGEOVER' 
                                  ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'
                                  : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                border: `2px solid ${performance.artist_name === 'CHANGEOVER' ? '#856404' : '#1976d2'}`,
                                borderRadius: 2,
                                overflow: 'hidden',
                                cursor: 'grab',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  transform: 'scale(1.02)',
                                }
                              }}
                            >
                              <CardContent sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <DragIndicator fontSize="small" sx={{ color: performance.artist_name === 'CHANGEOVER' ? '#856404' : '#1976d2', mr: 1 }} />
                                  <Typography 
                                    variant="subtitle2" 
                                    fontWeight="bold"
                                    sx={{ 
                                      color: performance.artist_name === 'CHANGEOVER' ? '#856404' : '#1976d2',
                                      flex: 1
                                    }}
                                  >
                                    {performance.artist_name}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ mb: 1, opacity: 0.8 }}>
                                  {performance.start_time} • {performance.duration_minutes}min
                                </Typography>
                              </CardContent>
                            </Card>
                            
                            {/* Setup time indicator */}
                            {performance.setup_time > 0 && (
                              <Card
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetupTimeClick(performance);
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: -setupHeight,
                                  left: 4,
                                  right: 4,
                                  height: setupHeight,
                                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2) 0%, rgba(156, 39, 176, 0.3) 100%)',
                                  border: '2px solid #9c27b0',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  zIndex: 1,
                                  '&:hover': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    transform: 'scale(1.02)',
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
                                  <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                                    Setup ({performance.setup_time}m)
                                  </Typography>
                                </CardContent>
                              </Card>
                            )}
                        </Box>
                    );
                  })}
                </Box>
            ))}
          </Box>
        </Box>
        
        {/* Time preview during drag */}
        {dragPreview.show && (
          <Box
            sx={{
              position: 'fixed',
              top: dragPreview.y - 40,
              left: dragPreview.x + 10,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 10000,
              pointerEvents: 'none'
            }}
          >
            Drop at: {dragPreview.time}
          </Box>
        )}
      </Box>
    );
  };

  const exportToSpreadsheet = async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      // This would connect to Google Sheets API in a real implementation
      alert('Export to Google Sheets functionality would be implemented here');
    } catch (error) {
      setError('Failed to export schedule');
    }
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Schedule Builder</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToSpreadsheet}
            >
              Export to Sheets
            </Button>
            <Button
              variant="contained"
              onClick={() => handleOpen()}
            >
              Add Performance
            </Button>
          </Box>
        </Box>

        {/* Festival Days Tabs */}
        {currentFestival && festivalDates.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {currentFestival.name} {currentFestival.year}
            </Typography>
            {festivalDates.length > 1 ? (
              <Tabs 
                value={selectedDayIndex} 
                onChange={(e, newValue) => {
                  setSelectedDayIndex(newValue);
                  setSelectedDate(festivalDates[newValue]);
                }}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {festivalDates.map((date, index) => {
                  const dayName = date.format('dddd');
                  const dateStr = date.format('MMM D');
                  return (
                    <Tab 
                      key={index} 
                      label={`Day ${index + 1} (${dayName}, ${dateStr})`} 
                    />
                  );
                })}
              </Tabs>
            ) : (
              <Typography variant="body1" color="primary" sx={{ mb: 2 }}>
                Single Day Event: {festivalDates[0].format('dddd, MMMM D, YYYY')}
              </Typography>
            )}
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Schedule for {selectedDate.format('dddd, MMMM D, YYYY')} 
          {currentFestival?.event_start_time && currentFestival?.event_end_time && 
            ` (${currentFestival.event_start_time} - ${currentFestival.event_end_time})`
          }
        </Typography>

        {renderProportionalTimeline()}

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingPerformance ? 'Edit Performance' : 'Add New Performance'}
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel>Artist</InputLabel>
                <Select
                  value={formData.artist_id}
                  onChange={(e) => setFormData({ ...formData, artist_id: e.target.value as string })}
                  label="Artist"
                >
                  {artists.map((artist) => (
                    <MenuItem key={artist.id} value={artist.id.toString()}>
                      {artist.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.artist_id === '' && (
                <Alert severity="info">
                  Need to add a new artist?{' '}
                  <Button size="small" onClick={() => window.open(`/event/${currentFestival?.id}/artists`, '_blank')}>
                    Go to Artists Page
                  </Button>
                </Alert>
              )}

              <FormControl fullWidth required>
                <InputLabel>Stage/Area</InputLabel>
                <Select
                  value={formData.stage_area_id}
                  onChange={(e) => setFormData({ ...formData, stage_area_id: e.target.value as string })}
                  label="Stage/Area"
                >
                  {stageAreas.map((stageArea) => (
                    <MenuItem key={stageArea.id} value={stageArea.id.toString()}>
                      {stageArea.name} ({stageArea.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Start Time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />

              <TextField
                label="Duration (minutes)"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                inputProps={{ min: 5, max: 300, step: 1 }}
                helperText="Performance duration in minutes"
                fullWidth
              />

              <TextField
                label="Setup Time (minutes)"
                type="number"
                value={formData.setup_time}
                onChange={(e) => setFormData({ ...formData, setup_time: parseInt(e.target.value) || 15 })}
                inputProps={{ min: 0, max: 120, step: 1 }}
                helperText="Time needed to set up before performance starts"
                fullWidth
              />

              <TextField
                label="Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : editingPerformance ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Performance Details Dialog */}
        <Dialog open={selectedPerformance !== null} onClose={() => setSelectedPerformance(null)} maxWidth="md" fullWidth>
          <DialogTitle>
            Performance Details
          </DialogTitle>
          <DialogContent>
            {selectedPerformance && (
              <Box sx={{ display: 'grid', gap: 3, mt: 1 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>{selectedPerformance.artist_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPerformance.start_time} • {selectedPerformance.duration_minutes} minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stage: {selectedPerformance.stage_area_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Setup Time: {selectedPerformance.setup_time} minutes
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      handleOpen(selectedPerformance);
                      setSelectedPerformance(null);
                    }}
                  >
                    Edit Performance
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      handleDelete(selectedPerformance.id);
                      setSelectedPerformance(null);
                    }}
                  >
                    Delete Performance
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedPerformance(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Setup Time Edit Dialog */}
        <Dialog open={setupTimeEdit.show} onClose={() => setSetupTimeEdit({ show: false, performanceId: 0, currentTime: 0 })} maxWidth="xs" fullWidth>
          <DialogTitle>
            Edit Setup Time
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Setup Time (minutes)"
              type="number"
              defaultValue={setupTimeEdit.currentTime}
              onChange={(e) => setSetupTimeEdit({ ...setupTimeEdit, currentTime: parseInt(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 120, step: 5 }}
              helperText="Time needed to set up before performance starts"
              fullWidth
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSetupTimeEdit({ show: false, performanceId: 0, currentTime: 0 })}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleSetupTimeUpdate(setupTimeEdit.currentTime)}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Schedule;