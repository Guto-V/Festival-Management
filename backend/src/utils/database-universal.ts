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
    if (config.database.type === 'postgresql') {
      // Use PostgreSQL for production
      const { initPostgresDatabase, getPostgresDatabase } = await import('./database-postgres');
      await initPostgresDatabase();
      databaseAdapter = getPostgresDatabase();
      console.log('🐘 Using PostgreSQL database');
    } else {
      // Use SQLite for development
      const { initDatabase: initSQLite, getSQLiteDatabase } = await import('./database-sqlite');
      await initSQLite();
      databaseAdapter = getSQLiteDatabase();
      console.log('📁 Using SQLite database');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
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