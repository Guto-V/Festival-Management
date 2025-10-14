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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add, Edit, Delete, DragHandle, SwapVert } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface StageArea {
  id: number;
  event_id: number;
  name: string;
  type: string;
  setup_time: number;
  breakdown_time: number;
  sort_order: number;
  is_active: boolean;
}

const Venues: React.FC = () => {
  const { currentFestival } = useFestival();
  const [stageAreas, setStageAreas] = useState<StageArea[]>([]);
  const [open, setOpen] = useState(false);
  const [editingStageArea, setEditingStageArea] = useState<StageArea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'stage',
    setup_time: '0',
    breakdown_time: '0',
    is_active: true,
  });

  useEffect(() => {
    if (currentFestival) {
      fetchVenues();
    }
  }, [currentFestival]);

  const fetchVenues = async () => {
    if (!currentFestival) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/stages-areas?event_id=${currentFestival.id}`);
      setStageAreas(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch stages and areas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (stageArea?: StageArea) => {
    if (stageArea) {
      setEditingStageArea(stageArea);
      setFormData({
        name: stageArea.name,
        type: stageArea.type,
        setup_time: stageArea.setup_time?.toString() || '0',
        breakdown_time: stageArea.breakdown_time?.toString() || '0',
        is_active: stageArea.is_active,
      });
    } else {
      setEditingStageArea(null);
      setFormData({
        name: '',
        type: 'stage',
        setup_time: '0',
        breakdown_time: '0',
        is_active: true,
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStageArea(null);
    setError('');
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      setError('Stage/Area name is required');
      return;
    }

    if (parseInt(formData.setup_time) < 0) {
      setError('Setup time cannot be negative');
      return;
    }

    if (parseInt(formData.breakdown_time) < 0) {
      setError('Breakdown time cannot be negative');
      return;
    }

    if (!currentFestival) {
      setError('No event selected');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        event_id: currentFestival.id,
        setup_time: parseInt(formData.setup_time),
        breakdown_time: parseInt(formData.breakdown_time),
      };

      if (editingStageArea) {
        await axios.put(`/api/stages-areas/${editingStageArea.id}`, data);
      } else {
        await axios.post('/api/stages-areas', data);
      }

      fetchVenues();
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save venue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this stage/area?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/stages-areas/${id}`);
        fetchVenues();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete stage/area');
        setLoading(false);
      }
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stageAreas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for responsive UI
    setStageAreas(items);

    // Update sort orders
    const stageAreaOrders = items.map((stageArea, index) => ({
      id: stageArea.id,
      sort_order: index + 1,
    }));

    try {
      await axios.put('/api/stages-areas/reorder', { stageAreaOrders });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to reorder stages and areas');
      // Revert on error
      fetchVenues();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Stages & Areas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            <SwapVert sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            Drag and drop to reorder stages and areas - this order will be used in the schedule
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Stage/Area
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40"></TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Setup Time</TableCell>
                <TableCell>Breakdown Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <Droppable droppableId="stages-areas">
              {(provided) => (
                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                  {stageAreas.map((stageArea, index) => (
                    <Draggable key={stageArea.id} draggableId={stageArea.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <TableCell {...provided.dragHandleProps}>
                            <DragHandle color="action" />
                          </TableCell>
                          <TableCell>
                            <Chip label={index + 1} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{stageArea.name}</TableCell>
                          <TableCell>
                            <Chip label={stageArea.type} size="small" />
                          </TableCell>
                          <TableCell>{stageArea.setup_time} min</TableCell>
                          <TableCell>{stageArea.breakdown_time} min</TableCell>
                          <TableCell>
                            <Chip
                              label={stageArea.is_active ? 'Active' : 'Inactive'}
                              color={stageArea.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleOpen(stageArea)} color="primary">
                              <Edit />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(stageArea.id)} color="error">
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {stageAreas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No stages or areas found. Add your first stage or area to get started!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Droppable>
          </Table>
        </TableContainer>
      </DragDropContext>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStageArea ? 'Edit Stage/Area' : 'Add New Stage/Area'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Stage/Area Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="stage">Stage</MenuItem>
                <MenuItem value="area">Area</MenuItem>
              </Select>
            </FormControl>


            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Setup Time (minutes)"
                type="number"
                value={formData.setup_time}
                onChange={(e) => setFormData({ ...formData, setup_time: e.target.value })}
              />
              <TextField
                label="Breakdown Time (minutes)"
                type="number"
                value={formData.breakdown_time}
                onChange={(e) => setFormData({ ...formData, breakdown_time: e.target.value })}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingStageArea ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Venues;