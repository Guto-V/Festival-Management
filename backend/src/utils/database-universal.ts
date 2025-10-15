// Universal database utility - automatically chooses SQLite or PostgreSQL based on environment
import { config } from '../config';

// Database interface that both SQLite and PostgreSQL adapters implement
export interface DatabaseAdapter {
  all(query: string, params?: any[]): Promise<any[]>;
  get(query: string, params?: any[]): Promise<any>;
  run(query: string, params?: any[]): Promise<{ lastID?: number; changes: number }>;
}

let databaseAdapter: DatabaseAdapter | null = null;

// Initialize the appropriate database based on configuration
export const initUniversalDatabase = async (): Promise<void> => {
  try {
    console.log('🔧 Database configuration:', {
      type: config.database.type,
      url: config.database.url ? '[CONFIGURED]' : '[NOT SET]',
      isProduction: config.isProduction
    });

    if (config.database.type === 'postgresql') {
      // Use PostgreSQL for production
      if (!config.database.url || !config.database.url.includes('postgresql')) {
        throw new Error('PostgreSQL DATABASE_URL is required for production but not configured');
      }
      const { initPostgresDatabase, getPostgresDatabase } = await import('./database-postgres');
      await initPostgresDatabase();
      databaseAdapter = getPostgresDatabase();
      console.log('🐘 Using PostgreSQL database');
    } else {
      // Use SQLite for development - but warn in serverless environments
      if (config.isProduction) {
        console.warn('⚠️  Using SQLite in production/serverless environment - this may not work correctly');
      }
      const { initDatabase: initSQLite, getSQLiteDatabase } = await import('./database-sqlite');
      await initSQLite();
      databaseAdapter = getSQLiteDatabase();
      console.log('📁 Using SQLite database');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    // In serverless environments, don't crash the entire function
    if (config.isProduction) {
      console.error('🚨 Database not available - some endpoints will not work');
      // Don't throw in production - let the app start without database
      return;
    }
    
    throw error;
  }
};

// Get the current database adapter
export const getUniversalDatabase = (): DatabaseAdapter => {
  if (!databaseAdapter) {
    throw new Error('Database not initialized. Call initUniversalDatabase() first.');
  }
  return databaseAdapter;
};

// Close database connections
export const closeUniversalDatabase = async (): Promise<void> => {
  if (config.database.type === 'postgresql') {
    const { closePostgresDatabase } = await import('./database-postgres');
    await closePostgresDatabase();
  }
  // SQLite doesn't need explicit closing
  
  databaseAdapter = null;
  console.log('Database connections closed');
};