import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  AttachMoney,
  ConfirmationNumber,
  Event,
  TrendingUp,
  Person,
  Schedule,
  ShoppingCart,
} from '@mui/icons-material';
import axios from 'axios';

interface TicketTailorStats {
  total_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  active_events: number;
  recent_orders: TicketTailorOrder[];
  is_mock_data?: boolean;
  message?: string;
}

interface TicketTailorOrder {
  id: string;
  event_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
  tickets_count: number;
}

interface TicketTailorEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'live' | 'ended' | 'cancelled';
  total_tickets_sold: number;
  total_revenue: number;
  currency: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity_sold: number;
  quantity_total: number;
  revenue: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent sx={{ textAlign: 'center', height: 140, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box
        sx={{
          backgroundColor: color,
          color: 'white',
          borderRadius: '50%',
          p: 1,
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Ticketing: React.FC = () => {
  const [stats, setStats] = useState<TicketTailorStats | null>(null);
  const [events, setEvents] = useState<TicketTailorEvent[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicketingData();
  }, []);

  const fetchTicketingData = async () => {
    setLoading(true);
    try {
      const [statsResponse, eventsResponse] = await Promise.all([
        axios.get('/api/ticketing/stats'),
        axios.get('/api/ticketing/events'),
      ]);

      setStats(statsResponse.data);
      setEvents(eventsResponse.data.data || []);

      // Fetch ticket types for the first active event
      if (eventsResponse.data.data && eventsResponse.data.data.length > 0) {
        const activeEvent = eventsResponse.data.data.find((e: TicketTailorEvent) => e.status === 'live') || eventsResponse.data.data[0];
        try {
          const ticketTypesResponse = await axios.get(`/api/ticketing/events/${activeEvent.id}/tickets`);
          setTicketTypes(ticketTypesResponse.data.data || []);
        } catch (error) {
          console.error('Failed to fetch ticket types:', error);
        }
      }

      setError('');
    } catch (error: any) {
      setError('Failed to fetch ticketing data');
      console.error('Ticketing data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'success';
      case 'ended': return 'default';
      case 'draft': return 'warning';
      case 'cancelled': return 'error';
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
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

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ticket Sales & Analytics
      </Typography>
      
      {stats?.is_mock_data && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Demo Mode:</strong> {stats.message}
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4 
        }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.total_revenue)}
            icon={<AttachMoney />}
            color="#4caf50"
          />
          <StatCard
            title="Tickets Sold"
            value={stats.total_tickets_sold.toLocaleString()}
            icon={<ConfirmationNumber />}
            color="#2196f3"
          />
          <StatCard
            title="Active Events"
            value={stats.active_events}
            subtitle={`of ${stats.total_events} total`}
            icon={<Event />}
            color="#ff9800"
          />
          <StatCard
            title="Recent Orders"
            value={stats.recent_orders.length}
            subtitle="last 10"
            icon={<ShoppingCart />}
            color="#9c27b0"
          />
        </Box>
      )}

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 3,
        mb: 4 
      }}>
        {/* Events List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Events
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {events.map((event) => (
                <Box key={event.id} sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {event.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={event.status} 
                        size="small" 
                        color={getStatusColor(event.status) as any}
                      />
                      <Typography variant="caption">
                        {event.total_tickets_sold} tickets • {formatCurrency(event.total_revenue)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
              {events.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No events found
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Ticket Types */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ticket Types Performance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ticketTypes.map((ticket) => {
                const soldPercentage = ticket.quantity_total > 0 
                  ? (ticket.quantity_sold / ticket.quantity_total) * 100 
                  : 0;
                
                return (
                  <Box key={ticket.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        {ticket.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(ticket.price)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption">
                        {ticket.quantity_sold} / {ticket.quantity_total} sold
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {formatCurrency(ticket.revenue)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={soldPercentage} 
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(soldPercentage)}% sold
                    </Typography>
                  </Box>
                );
              })}
              {ticketTypes.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No ticket types found
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Orders */}
      {stats && stats.recent_orders.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Tickets</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recent_orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.order_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {order.customer_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customer_email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{order.tickets_count}</TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={getStatusColor(order.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Ticketing;