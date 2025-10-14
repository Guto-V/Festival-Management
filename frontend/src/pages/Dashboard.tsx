import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Person,
  Schedule,
  Place,
  PeopleAlt,
  AttachMoney,
  Store,
  Warning,
  Assignment,
  Description,
  MonetizationOn,
} from '@mui/icons-material';
import axios from 'axios';
import { useFestival } from '../contexts/FestivalContext';

interface TodoItem {
  id: string;
  type: 'payment_overdue' | 'payment_due' | 'artist_contract' | 'vendor_contract' | 'document_expiry';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  related_id?: number;
  related_type?: string;
}

interface TodoResponse {
  festival_id: number;
  total_todos: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  todos: TodoItem[];
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card sx={{ 
    '&:hover': { 
      transform: 'translateY(-2px)',
      transition: 'transform 0.2s ease-in-out'
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h3" component="div" sx={{ 
            fontWeight: 700,
            color: '#212121',
            mb: 0.5
          }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.75rem'
          }}>
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            color: 'white',
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 48,
            minHeight: 48
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { currentFestival, festivalStats, loading } = useFestival();
  const [todos, setTodos] = useState<TodoResponse | null>(null);
  const [todosLoading, setTodosLoading] = useState(false);

  useEffect(() => {
    if (currentFestival) {
      fetchTodos();
    }
  }, [currentFestival]);

  const fetchTodos = async () => {
    if (!currentFestival) return;
    
    setTodosLoading(true);
    try {
      const response = await axios.get(`/api/todos?festival_id=${currentFestival.id}`);
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setTodosLoading(false);
    }
  };

  const getTodoIcon = (type: TodoItem['type']) => {
    switch (type) {
      case 'payment_overdue':
      case 'payment_due':
        return <MonetizationOn color="error" />;
      case 'artist_contract':
      case 'vendor_contract':
        return <Assignment color="warning" />;
      case 'document_expiry':
        return <Description color="info" />;
      default:
        return <Warning />;
    }
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentFestival) {
    return (
      <Alert severity="warning">
        Please select a festival to view the dashboard
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {currentFestival.name} Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {currentFestival.location} • {new Date(currentFestival.start_date).toLocaleDateString()} - {new Date(currentFestival.end_date).toLocaleDateString()}
        </Typography>
        <Chip 
          label={currentFestival.status.charAt(0).toUpperCase() + currentFestival.status.slice(1)} 
          color={currentFestival.status === 'active' ? 'success' : currentFestival.status === 'planning' ? 'warning' : 'default'}
          sx={{ mt: 1 }}
        />
      </Box>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
        gap: 3,
        mb: 4 
      }}>
        <StatCard
          title="Artists"
          value={festivalStats?.artists || 0}
          icon={<Person />}
          color="#1976d2"
        />
        <StatCard
          title="Performances"
          value={festivalStats?.performances || 0}
          icon={<Schedule />}
          color="#2e7d32"
        />
        <StatCard
          title="Venues"
          value={festivalStats?.venues || 0}
          icon={<Place />}
          color="#ed6c02"
        />
        <StatCard
          title="Volunteers"
          value={festivalStats?.volunteers || 0}
          icon={<PeopleAlt />}
          color="#1976d2"
        />
        <StatCard
          title="Vendors"
          value={festivalStats?.vendors || 0}
          icon={<Store />}
          color="#2e7d32"
        />
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3 
      }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 600,
              color: '#212121',
              mb: 3
            }}>
              Recent Activities
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  New artist added: The Welsh Folk Trio
                </Typography>
                <Chip 
                  label="2 hours ago" 
                  size="small" 
                  sx={{ 
                    bgcolor: '#e3f2fd',
                    color: '#1976d2',
                    fontWeight: 500
                  }}
                />
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Schedule updated for Llwyfan Foel Drigarn
                </Typography>
                <Chip 
                  label="4 hours ago" 
                  size="small"
                  sx={{ 
                    bgcolor: '#e8f5e8',
                    color: '#2e7d32',
                    fontWeight: 500
                  }}
                />
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  New volunteer registered
                </Typography>
                <Chip 
                  label="6 hours ago" 
                  size="small"
                  sx={{ 
                    bgcolor: '#fff3e0',
                    color: '#ed6c02',
                    fontWeight: 500
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: '#212121'
              }}>
                To-Do Tasks
              </Typography>
              {todos && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {todos.high_priority > 0 && (
                    <Chip 
                      label={`${todos.high_priority} High`} 
                      color="error" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                  {todos.medium_priority > 0 && (
                    <Chip 
                      label={`${todos.medium_priority} Med`} 
                      color="warning" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                  {todos.low_priority > 0 && (
                    <Chip 
                      label={`${todos.low_priority} Low`} 
                      color="info" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Box>
              )}
            </Box>
          
          {todosLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : todos && todos.todos.length > 0 ? (
            <List dense>
              {todos.todos.slice(0, 8).map((todo) => (
                <ListItem key={todo.id} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getTodoIcon(todo.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {todo.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {todo.description}
                      </Typography>
                    }
                  />
                  <Chip 
                    label={todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} 
                    color={getPriorityColor(todo.priority) as any} 
                    size="small" 
                  />
                </ListItem>
              ))}
              {todos.todos.length > 8 && (
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        And {todos.todos.length - 8} more tasks...
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                🎉 All caught up! No pending tasks.
              </Typography>
            </Box>
          )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;