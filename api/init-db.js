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

    // Recreate all tables with correct schemas matching local development
    try {
      // Drop and recreate performances table
      await pool.query('DROP TABLE IF EXISTS performances CASCADE');
      await pool.query(`
        CREATE TABLE performances (
          id SERIAL PRIMARY KEY,
          festival_id INTEGER NOT NULL,
          artist_id INTEGER NOT NULL,
          stage_area_id INTEGER NOT NULL,
          performance_date DATE NOT NULL,
          start_time TIME NOT NULL,
          duration_minutes INTEGER NOT NULL,
          changeover_time_after INTEGER DEFAULT 15,
          soundcheck_time TIME,
          soundcheck_duration INTEGER DEFAULT 30,
          notes TEXT,
          status VARCHAR(50) DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Drop and recreate volunteers table with correct schema
      await pool.query('DROP TABLE IF EXISTS volunteers CASCADE');
      await pool.query(`
        CREATE TABLE volunteers (
          id SERIAL PRIMARY KEY,
          festival_id INTEGER NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          skills TEXT,
          t_shirt_size VARCHAR(10),
          dietary_requirements TEXT,
          emergency_contact_name VARCHAR(255),
          emergency_contact_phone VARCHAR(50),
          assigned_role VARCHAR(255),
          volunteer_status VARCHAR(50) DEFAULT 'applied' CHECK(volunteer_status IN ('applied', 'approved', 'rejected', 'confirmed')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Drop and recreate contract_templates table with correct schema
      await pool.query('DROP TABLE IF EXISTS contract_templates CASCADE');
      await pool.query(`
        CREATE TABLE contract_templates (
          id SERIAL PRIMARY KEY,
          festival_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          is_default BOOLEAN DEFAULT FALSE,
          created_by INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Drop and recreate volunteer_applications table
      await pool.query('DROP TABLE IF EXISTS volunteer_applications CASCADE');
      await pool.query(`
        CREATE TABLE volunteer_applications (
          id SERIAL PRIMARY KEY,
          festival_id INTEGER NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          emergency_contact_name VARCHAR(255),
          emergency_contact_phone VARCHAR(50),
          availability TEXT,
          skills TEXT,
          experience TEXT,
          dietary_requirements TEXT,
          accommodation_needed BOOLEAN DEFAULT false,
          transport_needed BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'declined')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('All tables recreated with correct schemas matching local development');
    } catch (schemaError) {
      console.log('Schema recreation warning:', schemaError.message);
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

    // Create stages_areas table with exact local schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stages_areas (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL CHECK(type IN ('stage', 'area')),
        setup_time INTEGER DEFAULT 0,
        breakdown_time INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        ('Summer Music Festival 2025', 'Annual summer music celebration', '2025-07-15', '2025-07-17', 'Central Park', 'planning'),
        ('Fall Arts Festival 2025', 'Community arts and culture festival', '2025-09-10', '2025-09-12', 'Downtown Plaza', 'confirmed')
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

    // Insert sample stages data if empty
    const stagesCount = await pool.query('SELECT COUNT(*) FROM stages_areas');
    if (parseInt(stagesCount.rows[0].count) === 0) {
      try {
        await pool.query(`
          INSERT INTO stages_areas (event_id, name, type, sort_order, setup_time, breakdown_time, is_active) VALUES
          (1, 'Main Stage', 'stage', 0, 30, 15, true),
          (1, 'Acoustic Stage', 'stage', 1, 15, 10, true),
          (1, 'Food Court', 'area', 2, 0, 0, true),
          (1, 'VIP Area', 'area', 3, 60, 30, true),
          (2, 'Gallery Stage', 'stage', 0, 20, 15, true),
          (2, 'Workshop Area', 'area', 1, 10, 5, true)
        `);
      } catch (stagesError) {
        console.log('Stages insert error (non-critical):', stagesError.message);
      }
    }

    // Insert sample performance data if empty
    const performancesCount = await pool.query('SELECT COUNT(*) FROM performances');
    if (parseInt(performancesCount.rows[0].count) === 0) {
      try {
        // Get the artist and stage IDs for sample data
        const artistsResult = await pool.query('SELECT id FROM artists LIMIT 3');
        const stagesResult = await pool.query('SELECT id FROM stages_areas LIMIT 2');
        
        if (artistsResult.rows.length > 0 && stagesResult.rows.length > 0) {
          await pool.query(`
            INSERT INTO performances (
              festival_id, artist_id, stage_area_id, performance_date,
              start_time, duration_minutes, changeover_time_after, status
            ) VALUES
            (1, $1, $2, '2025-07-15', '18:00', 60, 15, 'scheduled'),
            (1, $3, $2, '2025-07-15', '20:00', 75, 15, 'scheduled'),
            (1, $4, $5, '2025-07-16', '19:30', 90, 20, 'confirmed'),
            (1, $1, $5, '2025-07-17', '16:00', 45, 10, 'scheduled')
          `, [
            artistsResult.rows[0].id,
            stagesResult.rows[0].id,
            artistsResult.rows[1]?.id || artistsResult.rows[0].id,
            artistsResult.rows[2]?.id || artistsResult.rows[0].id,
            stagesResult.rows[1]?.id || stagesResult.rows[0].id
          ]);
        }
      } catch (performancesError) {
        console.log('Performances insert error (non-critical):', performancesError.message);
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