// Schedule, Budget, and Performance API endpoint (consolidated)
import { Pool } from 'pg';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  
  try {
    // Handle budget requests (simple fallback)
    if (url.includes('budget')) {
      if (req.method === 'GET') {
        return res.status(200).json([]);
      }
      if (req.method === 'POST') {
        return res.status(201).json({ id: Date.now(), ...req.body });
      }
    }

    // Handle performance requests
    if (url.includes('performance')) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      // Create performances table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS performances (
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

      if (req.method === 'GET') {
        const { festival_id } = req.query;
        let query = 'SELECT * FROM performances';
        const params = [];
        
        if (festival_id) {
          query += ' WHERE festival_id = $1';
          params.push(festival_id);
        }
        
        query += ' ORDER BY performance_date, start_time';
        const result = await pool.query(query, params);
        await pool.end();
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { 
          festival_id, artist_id, stage_area_id, performance_date, 
          start_time, duration_minutes, changeover_time_after, 
          soundcheck_time, soundcheck_duration, status, notes 
        } = req.body;

        // Ensure required fields are provided
        if (!festival_id || !artist_id || !stage_area_id || !performance_date || !start_time || !duration_minutes) {
          await pool.end();
          return res.status(400).json({ 
            error: 'Missing required fields: festival_id, artist_id, stage_area_id, performance_date, start_time, duration_minutes' 
          });
        }

        const result = await pool.query(`
          INSERT INTO performances (
            festival_id, artist_id, stage_area_id, performance_date,
            start_time, duration_minutes, changeover_time_after,
            soundcheck_time, soundcheck_duration, status, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          festival_id, artist_id, stage_area_id, performance_date,
          start_time, duration_minutes, changeover_time_after || 15,
          soundcheck_time, soundcheck_duration || 30, status || 'scheduled', notes
        ]);

        await pool.end();
        return res.status(201).json(result.rows[0]);
      }

      if (req.method === 'PUT') {
        // Extract ID from URL path
        const urlParts = url.split('/');
        const id = urlParts[urlParts.length - 1];
        
        const { 
          festival_id, artist_id, stage_area_id, performance_date,
          start_time, duration_minutes, changeover_time_after,
          soundcheck_time, soundcheck_duration, status, notes 
        } = req.body;

        // Build dynamic update query to only update provided fields
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (festival_id !== undefined) {
          updateFields.push(`festival_id = $${paramCount++}`);
          values.push(festival_id);
        }
        if (artist_id !== undefined) {
          updateFields.push(`artist_id = $${paramCount++}`);
          values.push(artist_id);
        }
        if (stage_area_id !== undefined) {
          updateFields.push(`stage_area_id = $${paramCount++}`);
          values.push(stage_area_id);
        }
        if (performance_date !== undefined) {
          updateFields.push(`performance_date = $${paramCount++}`);
          values.push(performance_date);
        }
        if (start_time !== undefined) {
          updateFields.push(`start_time = $${paramCount++}`);
          values.push(start_time);
        }
        if (duration_minutes !== undefined) {
          updateFields.push(`duration_minutes = $${paramCount++}`);
          values.push(duration_minutes);
        }
        if (changeover_time_after !== undefined) {
          updateFields.push(`changeover_time_after = $${paramCount++}`);
          values.push(changeover_time_after);
        }
        if (soundcheck_time !== undefined) {
          updateFields.push(`soundcheck_time = $${paramCount++}`);
          values.push(soundcheck_time);
        }
        if (soundcheck_duration !== undefined) {
          updateFields.push(`soundcheck_duration = $${paramCount++}`);
          values.push(soundcheck_duration);
        }
        if (status !== undefined) {
          updateFields.push(`status = $${paramCount++}`);
          values.push(status);
        }
        if (notes !== undefined) {
          updateFields.push(`notes = $${paramCount++}`);
          values.push(notes);
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(`
          UPDATE performances SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `, values);

        await pool.end();
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Performance not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      }

      if (req.method === 'DELETE') {
        // Extract ID from URL path
        const urlParts = url.split('/');
        const id = urlParts[urlParts.length - 1];
        
        await pool.query('DELETE FROM performances WHERE id = $1', [id]);
        await pool.end();
        
        return res.status(200).json({ success: true });
      }

      await pool.end();
    }

    // Handle schedule grid requests
    if (url.includes('grid')) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      // Create performances table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS performances (
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

      if (req.method === 'GET') {
        const { festival_id, event_id } = req.query;
        
        // Get performances for the date
        const performancesResult = await pool.query(`
          SELECT 
            p.id,
            p.festival_id,
            p.artist_id,
            p.stage_area_id,
            TO_CHAR(p.performance_date, 'YYYY-MM-DD') as performance_date,
            TO_CHAR(p.start_time, 'HH24:MI') as start_time,
            p.duration_minutes,
            p.changeover_time_after as setup_time,
            TO_CHAR(p.soundcheck_time, 'HH24:MI') as soundcheck_time,
            p.soundcheck_duration,
            p.status,
            p.notes,
            a.name as artist_name,
            sa.name as stage_name
          FROM performances p
          LEFT JOIN artists a ON p.artist_id = a.id
          LEFT JOIN stages_areas sa ON p.stage_area_id = sa.id
          WHERE p.festival_id = $1
          ORDER BY p.performance_date, p.start_time
        `, [festival_id || event_id || 1]);

        // Generate time slots (9 AM to 11 PM in 30-minute intervals)
        const timeSlots = [];
        for (let hour = 9; hour <= 23; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSlots.push(timeStr);
          }
        }

        await pool.end();
        
        return res.status(200).json({
          time_slots: timeSlots,
          performances: performancesResult.rows
        });
      }

      await pool.end();
    }

    // Handle main schedule requests (for Timetable page)
    if (req.method === 'GET') {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      const { festival_id, event_id } = req.query;
      
      try {
        // Get all performances with artist and stage names
        const result = await pool.query(`
          SELECT 
            p.id,
            p.festival_id,
            p.artist_id,
            p.stage_area_id,
            TO_CHAR(p.performance_date, 'YYYY-MM-DD') as performance_date,
            TO_CHAR(p.start_time, 'HH24:MI') as start_time,
            p.duration_minutes,
            p.changeover_time_after as setup_time,
            TO_CHAR(p.soundcheck_time, 'HH24:MI') as soundcheck_time,
            p.soundcheck_duration,
            p.status,
            p.notes,
            a.name as artist_name,
            sa.name as stage_area_name
          FROM performances p
          LEFT JOIN artists a ON p.artist_id = a.id
          LEFT JOIN stages_areas sa ON p.stage_area_id = sa.id
          WHERE p.festival_id = $1
          ORDER BY p.performance_date, p.start_time
        `, [festival_id || event_id || 1]);

        await pool.end();
        
        console.log(`Schedule API: festival_id=${festival_id || event_id}, found ${result.rows.length} performances`);
        if (result.rows.length > 0) {
          console.log('Sample performance:', result.rows[0]);
        }
        
        return res.status(200).json(result.rows);
      } catch (error) {
        await pool.end();
        throw error;
      }
    }

    if (req.method === 'POST') {
      return res.status(201).json({ id: Date.now(), ...req.body });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Schedule API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process schedule request',
      error: error.message 
    });
  }
}