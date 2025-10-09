import axios from 'axios';

interface TicketTailorConfig {
  apiKey: string;
  baseUrl: string;
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

interface TicketTailorTicketType {
  id: string;
  name: string;
  price: number;
  quantity_sold: number;
  quantity_total: number;
  revenue: number;
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

interface TicketTailorStats {
  total_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  active_events: number;
  recent_orders: TicketTailorOrder[];
}

export class TicketTailorService {
  private config: TicketTailorConfig;

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.tickettailor.com/v1'
    };
  }

  private async makeRequest(endpoint: string, params?: any) {
    try {
      const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('Ticket Tailor API Error:', error.response?.data || error.message);
      throw new Error(`Ticket Tailor API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async getEvents(): Promise<TicketTailorEvent[]> {
    try {
      const data = await this.makeRequest('/events');
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return [];
    }
  }

  async getEvent(eventId: string): Promise<TicketTailorEvent | null> {
    try {
      const data = await this.makeRequest(`/events/${eventId}`);
      return data.data || null;
    } catch (error) {
      console.error(`Failed to fetch event ${eventId}:`, error);
      return null;
    }
  }

  async getEventTicketTypes(eventId: string): Promise<TicketTailorTicketType[]> {
    try {
      const data = await this.makeRequest(`/events/${eventId}/ticket_types`);
      return data.data || [];
    } catch (error) {
      console.error(`Failed to fetch ticket types for event ${eventId}:`, error);
      return [];
    }
  }

  async getOrders(eventId?: string): Promise<TicketTailorOrder[]> {
    try {
      const params = eventId ? { event_id: eventId } : {};
      const data = await this.makeRequest('/orders', params);
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  async getTicketTailorStats(): Promise<TicketTailorStats> {
    try {
      const [events, orders] = await Promise.all([
        this.getEvents(),
        this.getOrders()
      ]);

      const totalTicketsSold = events.reduce((sum, event) => sum + event.total_tickets_sold, 0);
      const totalRevenue = events.reduce((sum, event) => sum + event.total_revenue, 0);
      const activeEvents = events.filter(event => event.status === 'live').length;
      const recentOrders = orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      return {
        total_events: events.length,
        total_tickets_sold: totalTicketsSold,
        total_revenue: totalRevenue,
        active_events: activeEvents,
        recent_orders: recentOrders
      };
    } catch (error) {
      console.error('Failed to fetch Ticket Tailor stats:', error);
      return {
        total_events: 0,
        total_tickets_sold: 0,
        total_revenue: 0,
        active_events: 0,
        recent_orders: []
      };
    }
  }

  // Mock data for development/testing when no API key is provided
  getMockStats(): TicketTailorStats {
    return {
      total_events: 3,
      total_tickets_sold: 1247,
      total_revenue: 18705.50,
      active_events: 1,
      recent_orders: [
        {
          id: 'ord_123',
          event_id: 'evt_456',
          order_number: 'TT-001234',
          customer_name: 'John Smith',
          customer_email: 'john@example.com',
          total_amount: 45.00,
          status: 'confirmed',
          created_at: new Date().toISOString(),
          tickets_count: 2
        },
        {
          id: 'ord_124',
          event_id: 'evt_456',
          order_number: 'TT-001235',
          customer_name: 'Sarah Jones',
          customer_email: 'sarah@example.com',
          total_amount: 67.50,
          status: 'confirmed',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          tickets_count: 3
        }
      ]
    };
  }

  getMockEvents(): TicketTailorEvent[] {
    return [
      {
        id: 'evt_456',
        name: 'Welsh Folk Festival 2024',
        start_date: '2024-07-15T09:00:00Z',
        end_date: '2024-07-17T23:00:00Z',
        status: 'live',
        total_tickets_sold: 847,
        total_revenue: 12705.50,
        currency: 'GBP'
      },
      {
        id: 'evt_457',
        name: 'Welsh Folk Festival 2023',
        start_date: '2023-07-15T09:00:00Z',
        end_date: '2023-07-17T23:00:00Z',
        status: 'ended',
        total_tickets_sold: 400,
        total_revenue: 6000.00,
        currency: 'GBP'
      }
    ];
  }
}

export default TicketTailorService;