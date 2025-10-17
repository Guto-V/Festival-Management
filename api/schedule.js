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
          festival_id INTEGER,
          artist_id INTEGER,
          stage_area_id INTEGER,
          performance_date DATE,
          start_time TIME,
          duration_minutes INTEGER DEFAULT 60,
          setup_time INTEGER DEFAULT 15,
          status VARCHAR(50) DEFAULT 'scheduled',
          notes TEXT,
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
          start_time, duration_minutes, setup_time, status, notes 
        } = req.body;

        const result = await pool.query(`
          INSERT INTO performances (
            festival_id, artist_id, stage_area_id, performance_date,
            start_time, duration_minutes, setup_time, status, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          festival_id || 1, artist_id, stage_area_id, performance_date,
          start_time, duration_minutes || 60, setup_time || 15, 
          status || 'scheduled', notes
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
          start_time, duration_minutes, setup_time, status, notes 
        } = req.body;

        const result = await pool.query(`
          UPDATE performances SET
            festival_id = $1, artist_id = $2, stage_area_id = $3,
            performance_date = $4, start_time = $5, duration_minutes = $6,
            setup_time = $7, status = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
          WHERE id = $10
          RETURNING *
        `, [
          festival_id, artist_id, stage_area_id, performance_date,
          start_time, duration_minutes, setup_time, status, notes, id
        ]);

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

    // Default schedule behavior (non-performance)
    if (req.method === 'GET') {
      return res.status(200).json([]);
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