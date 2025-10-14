import { Pool, PoolClient } from 'pg';
import { config } from '../config';

let pool: Pool | null = null;

// Initialize PostgreSQL connection pool
export const initPostgresDatabase = async (): Promise<void> => {
  try {
    if (!config.database.url.includes('postgresql')) {
      throw new Error('PostgreSQL URL required for production database');
    }

    pool = new Pool({
      connectionString: config.database.url,
      max: config.database.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: config.isProduction ? { rejectUnauthorized: false } : false
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    console.log('✅ PostgreSQL database connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL database connection failed:', error);
    throw error;
  }
};

// Get PostgreSQL client for transactions
export const getPostgresClient = async (): Promise<PoolClient> => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return await pool.connect();
};

// Execute query with automatic connection management
export const queryPostgres = async (text: string, params?: any[]): Promise<any> => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
};

// Execute single query and return first row
export const queryPostgresOne = async (text: string, params?: any[]): Promise<any> => {
  const rows = await queryPostgres(text, params);
  return rows.length > 0 ? rows[0] : null;
};

// Execute query and return result metadata
export const queryPostgresRun = async (text: string, params?: any[]): Promise<{ rowCount: number; lastID?: number }> => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return {
      rowCount: result.rowCount || 0,
      lastID: result.rows[0]?.id // For INSERT ... RETURNING id queries
    };
  } finally {
    client.release();
  }
};

// Close the connection pool
export const closePostgresDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL connection pool closed');
  }
};

// Database adapter that provides SQLite-like interface for PostgreSQL
export class PostgresAdapter {
  async all(query: string, params?: any[]): Promise<any[]> {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    const pgQuery = this.convertQuery(query);
    return await queryPostgres(pgQuery, params);
  }

  async get(query: string, params?: any[]): Promise<any> {
    const pgQuery = this.convertQuery(query);
    return await queryPostgresOne(pgQuery, params);
  }

  async run(query: string, params?: any[]): Promise<{ lastID?: number; changes: number }> {
    let pgQuery = this.convertQuery(query);
    
    // Add RETURNING id for INSERT queries to simulate lastID
    if (pgQuery.trim().toLowerCase().startsWith('insert') && !pgQuery.toLowerCase().includes('returning')) {
      pgQuery += ' RETURNING id';
    }

    const result = await queryPostgresRun(pgQuery, params);
    
    return {
      lastID: result.lastID,
      changes: result.rowCount
    };
  }

  private convertQuery(query: string): string {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    let paramCount = 0;
    return query.replace(/\?/g, () => `$${++paramCount}`);
  }
}

export const getPostgresDatabase = (): PostgresAdapter => {
  return new PostgresAdapter();
};