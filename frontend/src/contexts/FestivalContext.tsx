import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface Festival {
  id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  location?: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  budget_total: number;
  budget_allocated: number;
  event_start_time?: string;
  event_end_time?: string;
  use_custom_daily_times?: boolean;
  daily_times?: string;
  created_at: string;
  updated_at: string;
}

interface FestivalStats {
  festival_id: number;
  venues: number;
  performances: number;
  artists: number;
  volunteers: number;
  vendors: number;
  total_income: number;
  total_expenses: number;
  net_profit: number;
}

interface FestivalContextType {
  currentFestival: Festival | null;
  festivals: Festival[];
  festivalStats: FestivalStats | null;
  loading: boolean;
  error: string;
  setCurrentFestival: (festival: Festival | null) => void;
  switchFestival: (festivalId: number) => Promise<void>;
  refreshFestivals: () => Promise<void>;
  createFestival: (festivalData: Partial<Festival>) => Promise<Festival>;
  updateFestival: (id: number, festivalData: Partial<Festival>) => Promise<Festival>;
  deleteFestival: (id: number, force?: boolean) => Promise<void>;
  cloneFestival: (id: number, cloneData: { name: string; year: number; start_date: string; end_date: string; cloneOptions?: any }) => Promise<Festival>;
  hasEventAccess: (festivalId: number) => boolean;
}

const FestivalContext = createContext<FestivalContextType | undefined>(undefined);

export const useFestival = () => {
  const context = useContext(FestivalContext);
  if (context === undefined) {
    throw new Error('useFestival must be used within a FestivalProvider');
  }
  return context;
};

interface FestivalProviderProps {
  children: ReactNode;
}

export const FestivalProvider: React.FC<FestivalProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentFestival, setCurrentFestival] = useState<Festival | null>(null);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [festivalStats, setFestivalStats] = useState<FestivalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load saved festival from localStorage or use first available
  useEffect(() => {
    const initializeFestival = async () => {
      await refreshFestivals();
    };
    initializeFestival();
  }, []);

  // Load festival stats when current festival changes
  useEffect(() => {
    if (currentFestival) {
      loadFestivalStats(currentFestival.id);
      // Save current festival to localStorage
      localStorage.setItem('currentFestivalId', currentFestival.id.toString());
    }
  }, [currentFestival]);

  // Refresh festivals when user changes (permissions may affect accessible festivals)
  useEffect(() => {
    if (user) {
      refreshFestivals();
    }
  }, [user]);

  const filterFestivalsByUserAccess = (festivals: Festival[]) => {
    if (!user) return [];
    
    // Admins have access to all events
    if (user.role === 'admin') {
      return festivals;
    }
    
    // For users with specific event access, filter to only allowed events
    if (user.event_access === 'specific' && user.allowed_events) {
      return festivals.filter(festival => user.allowed_events!.includes(festival.id));
    }
    
    // Default: users with 'all' access or undefined access get all festivals
    return festivals;
  };

  const refreshFestivals = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await axios.get('/api/festivals');
      
      // Filter festivals based on user access
      const accessibleFestivals = filterFestivalsByUserAccess(response.data);
      setFestivals(accessibleFestivals);
      
      if (accessibleFestivals.length > 0) {
        // Try to restore previously selected festival
        const savedFestivalId = localStorage.getItem('currentFestivalId');
        if (savedFestivalId) {
          const savedFestival = accessibleFestivals.find((f: Festival) => f.id === parseInt(savedFestivalId));
          if (savedFestival) {
            setCurrentFestival(savedFestival);
          } else {
            // Fallback to first accessible festival if saved one doesn't exist or isn't accessible
            setCurrentFestival(accessibleFestivals[0]);
          }
        } else {
          // Default to first accessible festival
          setCurrentFestival(accessibleFestivals[0]);
        }
      } else {
        setCurrentFestival(null);
      }
    } catch (error: any) {
      console.error('Failed to load festivals:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access festivals.');
      } else if (error.response?.status === 404) {
        setError('Festival service not found. Please contact support.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error.response?.data?.error || 'Failed to load festivals. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFestivalStats = async (festivalId: number) => {
    try {
      const response = await axios.get(`/api/festivals/${festivalId}/stats`);
      setFestivalStats(response.data);
    } catch (error: any) {
      console.error('Failed to load festival stats:', error);
      setFestivalStats(null);
      
      // Don't show stats errors to user unless it's a serious issue
      if (error.response?.status === 401) {
        setError('Session expired while loading statistics.');
      }
    }
  };

  const switchFestival = async (festivalId: number) => {
    // Check if the festival exists in the user's accessible festivals list
    const festival = festivals.find(f => f.id === festivalId);
    if (festival) {
      setCurrentFestival(festival);
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Festival not found or access denied'));
    }
  };

  const createFestival = async (festivalData: Partial<Festival>): Promise<Festival> => {
    try {
      const response = await axios.post('/api/festivals', festivalData);
      const newFestival = response.data;
      setFestivals(prev => [newFestival, ...prev]);
      setError('');
      return newFestival;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create festival');
      throw error;
    }
  };

  const updateFestival = async (id: number, festivalData: Partial<Festival>): Promise<Festival> => {
    try {
      const response = await axios.put(`/api/festivals/${id}`, festivalData);
      const updatedFestival = response.data;
      
      setFestivals(prev => prev.map(f => f.id === id ? updatedFestival : f));
      
      // Update current festival if it's the one being edited
      if (currentFestival && currentFestival.id === id) {
        setCurrentFestival(updatedFestival);
      }
      
      setError('');
      return updatedFestival;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update festival');
      throw error;
    }
  };

  const deleteFestival = async (id: number, force: boolean = false): Promise<void> => {
    try {
      const url = force ? `/api/festivals/${id}?force=true` : `/api/festivals/${id}`;
      await axios.delete(url);
      setFestivals(prev => prev.filter(f => f.id !== id));
      
      // Switch to another festival if current one was deleted
      if (currentFestival && currentFestival.id === id) {
        const remainingFestivals = festivals.filter(f => f.id !== id);
        setCurrentFestival(remainingFestivals.length > 0 ? remainingFestivals[0] : null);
      }
      
      setError('');
    } catch (error: any) {
      if (error.response?.data?.canForceDelete) {
        // Re-throw with additional info for force delete option
        const enhancedError = new Error(error.response.data.error);
        (enhancedError as any).canForceDelete = true;
        (enhancedError as any).details = error.response.data.details;
        throw enhancedError;
      }
      setError(error.response?.data?.error || 'Failed to delete festival');
      throw error;
    }
  };

  const cloneFestival = async (
    id: number, 
    cloneData: { name: string; year: number; start_date: string; end_date: string; cloneOptions?: any }
  ): Promise<Festival> => {
    try {
      const response = await axios.post(`/api/festivals/${id}/clone`, cloneData);
      const clonedFestival = response.data;
      setFestivals(prev => [clonedFestival, ...prev]);
      setError('');
      return clonedFestival;
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to clone festival');
      throw error;
    }
  };

  const hasEventAccess = (festivalId: number): boolean => {
    if (!user) return false;
    
    // Admins have access to all events
    if (user.role === 'admin') {
      return true;
    }
    
    // Users with 'all' access have access to all events
    if (user.event_access === 'all' || !user.event_access) {
      return true;
    }
    
    // Users with 'specific' access only have access to their allowed events
    return user.allowed_events?.includes(festivalId) || false;
  };

  const value: FestivalContextType = {
    currentFestival,
    festivals,
    festivalStats,
    loading,
    error,
    setCurrentFestival,
    switchFestival,
    refreshFestivals,
    createFestival,
    updateFestival,
    deleteFestival,
    cloneFestival,
    hasEventAccess,
  };

  return (
    <FestivalContext.Provider value={value}>
      {children}
    </FestivalContext.Provider>
  );
};

export default FestivalContext;