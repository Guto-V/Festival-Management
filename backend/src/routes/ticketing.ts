import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import TicketTailorService from '../services/ticketTailorService';

const router = express.Router();

// Get Ticket Tailor configuration and stats
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY;
    
    if (!apiKey) {
      // Return mock data if no API key is configured
      const service = new TicketTailorService('');
      const mockStats = service.getMockStats();
      return res.json({
        ...mockStats,
        is_mock_data: true,
        message: 'Using mock data - configure TICKET_TAILOR_API_KEY to connect to real Ticket Tailor data'
      });
    }

    const service = new TicketTailorService(apiKey);
    const stats = await service.getTicketTailorStats();
    
    res.json({
      ...stats,
      is_mock_data: false
    });
  } catch (error) {
    console.error('Get Ticket Tailor stats error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket sales data' });
  }
});

// Get events from Ticket Tailor
router.get('/events', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY;
    
    if (!apiKey) {
      const service = new TicketTailorService('');
      const mockEvents = service.getMockEvents();
      return res.json({
        data: mockEvents,
        is_mock_data: true,
        message: 'Using mock data - configure TICKET_TAILOR_API_KEY to connect to real Ticket Tailor data'
      });
    }

    const service = new TicketTailorService(apiKey);
    const events = await service.getEvents();
    
    res.json({
      data: events,
      is_mock_data: false
    });
  } catch (error) {
    console.error('Get Ticket Tailor events error:', error);
    res.status(500).json({ error: 'Failed to fetch events from Ticket Tailor' });
  }
});

// Get ticket types for a specific event
router.get('/events/:eventId/tickets', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { eventId } = req.params;
    const apiKey = process.env.TICKET_TAILOR_API_KEY;
    
    if (!apiKey) {
      return res.json({
        data: [
          {
            id: 'tt_1',
            name: 'Early Bird',
            price: 15.00,
            quantity_sold: 234,
            quantity_total: 300,
            revenue: 3510.00
          },
          {
            id: 'tt_2',
            name: 'Standard',
            price: 25.00,
            quantity_sold: 456,
            quantity_total: 800,
            revenue: 11400.00
          },
          {
            id: 'tt_3',
            name: 'VIP',
            price: 45.00,
            quantity_sold: 67,
            quantity_total: 100,
            revenue: 3015.00
          }
        ],
        is_mock_data: true,
        message: 'Using mock data - configure TICKET_TAILOR_API_KEY to connect to real Ticket Tailor data'
      });
    }

    const service = new TicketTailorService(apiKey);
    const ticketTypes = await service.getEventTicketTypes(eventId);
    
    res.json({
      data: ticketTypes,
      is_mock_data: false
    });
  } catch (error) {
    console.error('Get ticket types error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket types' });
  }
});

// Get recent orders
router.get('/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { event_id } = req.query;
    const apiKey = process.env.TICKET_TAILOR_API_KEY;
    
    if (!apiKey) {
      const service = new TicketTailorService('');
      const mockStats = service.getMockStats();
      return res.json({
        data: mockStats.recent_orders,
        is_mock_data: true,
        message: 'Using mock data - configure TICKET_TAILOR_API_KEY to connect to real Ticket Tailor data'
      });
    }

    const service = new TicketTailorService(apiKey);
    const orders = await service.getOrders(event_id as string);
    
    res.json({
      data: orders,
      is_mock_data: false
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;