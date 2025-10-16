// Festivals API endpoint
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

    // Get ID from query parameter (rewritten by Vercel routes)
    const { id } = req.query;

    if (req.method === 'GET') {
      
      if (id) {
        // Get single festival by ID
        const result = await pool.query(`
          SELECT id, name, description, start_date, end_date, location, 
                 website, contact_email, contact_phone, budget, status,
                 created_at, updated_at
          FROM festivals 
          WHERE id = $1
        `, [id]);
        
        await pool.end();
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Festival not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      }
      
      // Get all festivals
      const result = await pool.query(`
        SELECT id, name, description, start_date, end_date, location, 
               website, contact_email, contact_phone, budget, status,
               created_at, updated_at
        FROM festivals 
        ORDER BY start_date DESC
      `);

      await pool.end();
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status } = req.body;

      const result = await pool.query(`
        INSERT INTO festivals (name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status || 'planning']);

      await pool.end();
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status } = req.body;

      const result = await pool.query(`
        UPDATE festivals SET
          name = $1, description = $2, start_date = $3, end_date = $4,
          location = $5, website = $6, contact_email = $7, contact_phone = $8,
          budget = $9, status = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *
      `, [name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status, id]);

      await pool.end();
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Festival not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Festivals API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to load festivals',
      error: error.message 
    });
  }
}