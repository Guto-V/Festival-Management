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
      
      // Create table if it doesn't exist - match local schema exactly
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

      let query = 'SELECT * FROM stages_areas';
      const params = [];
      
      if (event_id) {
        query += ' WHERE event_id = $1';
        params.push(event_id);
      }
      
      query += ' ORDER BY sort_order ASC, id ASC';
      
      const result = await pool.query(query, params);
      await pool.end();
      
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { event_id, name, type, setup_time, breakdown_time, sort_order } = req.body;

      const result = await pool.query(`
        INSERT INTO stages_areas (event_id, name, type, setup_time, breakdown_time, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *
      `, [event_id || 1, name, type || 'stage', setup_time || 0, breakdown_time || 0, sort_order || 0]);

      await pool.end();
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      
      // Check if this is a reorder request (batch update)
      if (req.body.stages && Array.isArray(req.body.stages)) {
        // Handle batch reorder
        try {
          for (const stage of req.body.stages) {
            await pool.query(`
              UPDATE stages_areas SET sort_order = $1 WHERE id = $2
            `, [stage.sort_order, stage.id]);
          }
          
          // Return updated stages in correct order
          const result = await pool.query(`
            SELECT * FROM stages_areas WHERE event_id = $1 ORDER BY sort_order ASC, id ASC
          `, [req.body.stages[0].event_id || 1]);
          
          await pool.end();
          return res.status(200).json(result.rows);
        } catch (error) {
          await pool.end();
          throw error;
        }
      }
      
      // Handle single stage update
      const { event_id, name, type, setup_time, breakdown_time, sort_order, is_active } = req.body;

      const result = await pool.query(`
        UPDATE stages_areas SET
          event_id = $1, name = $2, type = $3, setup_time = $4,
          breakdown_time = $5, sort_order = $6, is_active = $7
        WHERE id = $8
        RETURNING *
      `, [event_id, name, type, setup_time || 0, breakdown_time || 0, sort_order || 0, is_active !== false, id]);

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