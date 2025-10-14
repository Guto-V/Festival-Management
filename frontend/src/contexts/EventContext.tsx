import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface Event {
  id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  venue_id?: number;
  venue_name?: string;
  location?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  budget_total: number;
  description?: string;
}

interface EventContextType {
  currentEvent: Event | null;
  loading: boolean;
  error: string;
  setCurrentEvent: (event: Event | null) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: React.ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const { eventId } = useParams();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEvent(parseInt(eventId));
    } else {
      setCurrentEvent(null);
    }
  }, [eventId]);

  const fetchEvent = async (id: number) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch the specific event
      const response = await axios.get(`/api/festivals/${id}`);
      const event = response.data;
      
      // Also fetch venue information if associated
      if (event.venue_id) {
        try {
          const venueResponse = await axios.get(`/api/venues-locations/${event.venue_id}`);
          event.venue_name = venueResponse.data.name;
        } catch (venueError) {
          console.warn('Failed to fetch venue information:', venueError);
        }
      }
      
      setCurrentEvent(event);
    } catch (error) {
      console.error('Failed to fetch event:', error);
      setError('Failed to load event information');
      setCurrentEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const value: EventContextType = {
    currentEvent,
    loading,
    error,
    setCurrentEvent,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

export default EventContext;