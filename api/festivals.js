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

    if (req.method === 'GET') {
      // Get all festivals
      const result = await pool.query(`
        SELECT id, name, description, start_date, end_date, location, 
               website, contact_email, contact_phone, budget, status,
               created_at, updated_at
        FROM festivals 
        ORDER BY start_date DESC
      `);

      await pool.end();

      return res.status(200).json({
        success: true,
        festivals: result.rows
      });
    }

    if (req.method === 'POST') {
      // Create new festival
      const { name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status } = req.body;

      const result = await pool.query(`
        INSERT INTO festivals (name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status || 'planning']);

      await pool.end();

      return res.status(201).json({
        success: true,
        festival: result.rows[0]
      });
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