// Database initialization endpoint
import { Pool } from 'pg';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS festivals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        location VARCHAR(255),
        website VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        budget DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'planning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Alter existing table to allow null dates if it exists
    try {
      await pool.query('ALTER TABLE festivals ALTER COLUMN start_date DROP NOT NULL');
      await pool.query('ALTER TABLE festivals ALTER COLUMN end_date DROP NOT NULL');
    } catch (alterError) {
      // Ignore if columns are already nullable
      console.log('Column alter warning (non-critical):', alterError.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS artists (
        id SERIAL PRIMARY KEY,
        festival_id INTEGER REFERENCES festivals(id),
        name VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        rider_requirements TEXT,
        technical_requirements TEXT,
        fee DECIMAL(10,2),
        fee_status VARCHAR(50) DEFAULT 'quoted',
        travel_requirements TEXT,
        accommodation_requirements TEXT,
        status VARCHAR(50) DEFAULT 'inquired',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample data if tables are empty
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (email, first_name, last_name, role, is_active) VALUES
        ('admin@festival.com', 'Admin', 'User', 'admin', true),
        ('organizer@festival.com', 'Event', 'Organizer', 'organizer', true)
      `);
    }

    const festivalCount = await pool.query('SELECT COUNT(*) FROM festivals');
    if (parseInt(festivalCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO festivals (name, description, start_date, end_date, location, status) VALUES
        ('Summer Music Festival 2024', 'Annual summer music celebration', '2024-07-15', '2024-07-17', 'Central Park', 'planning'),
        ('Fall Arts Festival', 'Community arts and culture festival', '2024-09-10', '2024-09-12', 'Downtown Plaza', 'confirmed')
      `);
    }

    const artistCount = await pool.query('SELECT COUNT(*) FROM artists');
    if (parseInt(artistCount.rows[0].count) === 0) {
      try {
        await pool.query(`
          INSERT INTO artists (festival_id, name, genre, contact_name, contact_email) VALUES
          (1, 'The Electric Waves', 'Electronic', 'Sarah Johnson', 'sarah@electricwaves.com'),
          (1, 'Acoustic Dreams', 'Folk', 'Mike Chen', 'mike@acousticdreams.com'),
          (2, 'City Jazz Ensemble', 'Jazz', 'Lisa Rodriguez', 'lisa@cityjazz.com')
        `);
      } catch (artistError) {
        console.log('Artist insert error (non-critical):', artistError.message);
      }
    }

    await pool.end();

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully'
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to initialize database',
      error: error.message 
    });
  }
}