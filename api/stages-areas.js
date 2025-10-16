// Stages and Areas API endpoint
import { Pool } from 'pg';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    if (req.method === 'GET') {
      const { event_id } = req.query;
      
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS stages_areas (
          id SERIAL PRIMARY KEY,
          event_id INTEGER,
          name VARCHAR(255) NOT NULL,
          capacity INTEGER,
          type VARCHAR(100),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      let query = 'SELECT * FROM stages_areas';
      const params = [];
      
      if (event_id) {
        query += ' WHERE event_id = $1';
        params.push(event_id);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await pool.query(query, params);
      await pool.end();
      
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { event_id, name, capacity, type, location, description } = req.body;
      
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS stages_areas (
          id SERIAL PRIMARY KEY,
          event_id INTEGER,
          name VARCHAR(255) NOT NULL,
          capacity INTEGER,
          type VARCHAR(100),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await pool.query(`
        INSERT INTO stages_areas (event_id, name, capacity, type, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [event_id || 1, name, capacity, type, description]);

      await pool.end();
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { event_id, name, capacity, type, location, description } = req.body;

      const result = await pool.query(`
        UPDATE stages_areas SET
          event_id = $1, name = $2, capacity = $3, type = $4,
          description = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `, [event_id, name, capacity, type, description, id]);

      await pool.end();
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stage/Area not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      await pool.query('DELETE FROM stages_areas WHERE id = $1', [id]);
      await pool.end();
      
      return res.status(200).json({ success: true });
    }

    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Stages/Areas API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process stages/areas request',
      error: error.message 
    });
  }
}