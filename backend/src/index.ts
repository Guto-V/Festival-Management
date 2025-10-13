import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './utils/database-sqlite';

import authRoutes from './routes/auth';
import artistRoutes from './routes/artists';
import scheduleRoutes from './routes/schedule';
import venueRoutes from './routes/venues';
import venueLocationRoutes from './routes/venues-locations';
import userRoutes from './routes/users';
import vendorRoutes from './routes/vendors';
import volunteerRoutes from './routes/volunteers';
import documentRoutes from './routes/documents';
import budgetRoutes from './routes/budget';
import festivalRoutes from './routes/festivals';
import todoRoutes from './routes/todos';
import ticketingRoutes from './routes/ticketing';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/festivals', festivalRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/stages-areas', venueRoutes);
app.use('/api/venue-locations', venueLocationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/ticketing', ticketingRoutes);

// Test endpoint
app.get('/api/volunteer-registration-test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Public volunteer registration endpoint (no auth required)
app.post('/api/volunteer-registration', async (req, res) => {
  const { getDatabase } = await import('./utils/database-sqlite');
  
  try {
    const { 
      firstName, lastName, email, phone, address, emergencyContact, emergencyPhone,
      experience, availability, inductionCompleted, festival_id
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    if (!festival_id) {
      return res.status(400).json({ error: 'Festival ID is required' });
    }

    const db = getDatabase();
    
    // Map frontend fields to database fields
    const result = await db.run(`
      INSERT INTO volunteers (
        festival_id, first_name, last_name, email, phone, skills,
        emergency_contact_name, emergency_contact_phone, 
        volunteer_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      festival_id, 
      firstName, 
      lastName, 
      email, 
      phone || '',
      `Experience: ${experience || 'Not provided'}\nAvailability: ${availability || 'Not provided'}\nAddress: ${address || 'Not provided'}`,
      emergencyContact || '',
      emergencyPhone || '',
      'applied', // Default status for new applications
      `Induction completed: ${inductionCompleted ? 'Yes' : 'No'}\nSubmitted via public registration form`
    ]);

    res.status(201).json({ 
      message: 'Volunteer application submitted successfully',
      applicationId: result.lastID 
    });
  } catch (error) {
    console.error('Volunteer registration error:', error);
    res.status(500).json({ error: 'Failed to submit application. Please try again.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🎪 Festival Management API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();