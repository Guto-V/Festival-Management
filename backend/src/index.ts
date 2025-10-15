import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { initUniversalDatabase } from './utils/database-universal';
import { config } from './config';
// import { logger, requestLogger } from './utils/logger';

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
import contractRoutes from './routes/contracts';
import healthRoutes from './routes/health';

const app = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('dev'));

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
app.use('/api/contracts', contractRoutes);
app.use('/api', healthRoutes);

// Test endpoint
app.get('/api/volunteer-registration-test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Public volunteer registration endpoint (no auth required)
app.post('/api/volunteer-registration', async (req, res) => {
  const { getUniversalDatabase } = await import('./utils/database-universal');
  
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

    const db = getUniversalDatabase();
    
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

// Serve frontend in production
if (config.isProduction) {
  const frontendPath = process.env.FRONTEND_BUILD_PATH || path.join(__dirname, '../../frontend/build');
  app.use(express.static(frontendPath));
  
  // Catch all handler for SPA routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    error: config.isDevelopment ? err.message : 'Internal server error',
    ...(config.isDevelopment && { stack: err.stack }),
  });
});

// Initialize database only once
let dbInitialized = false;
const initializeDatabase = async () => {
  if (!dbInitialized) {
    try {
      console.log('🚀 Starting Festival Management System v1.8.4');
      console.log(`Environment: ${config.nodeEnv}`);
      
      await initUniversalDatabase();
      console.log('✅ Database initialized successfully');
      dbInitialized = true;
    } catch (error: any) {
      console.error('❌ Database initialization failed:', error.message);
      // Don't crash in serverless - let basic endpoints work
      if (config.isProduction) {
        console.log('⚠️  Continuing without database in serverless environment');
        dbInitialized = true; // Mark as initialized to prevent retries
      } else {
        throw error;
      }
    }
  }
};

// For Vercel serverless deployment
if (config.isProduction) {
  // Initialize database when first request comes in
  app.use(async (req, res, next) => {
    await initializeDatabase();
    next();
  });
  
  // Export the app for Vercel (both CommonJS and ES modules)
  module.exports = app;
  export default app;
} else {
  // Traditional server for local development
  const startServer = async () => {
    try {
      await initializeDatabase();
      
      const server = app.listen(config.port, () => {
        console.log(`🎪 Festival Management API running on port ${config.port}`);
        console.log(`Health check: http://localhost:${config.port}/api/health`);
      });
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
      
      process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
      
    } catch (error: any) {
      console.error('Failed to start server:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  };

  startServer();
}