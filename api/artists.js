// Artists API endpoint
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
      // Get all artists
      const result = await pool.query(`
        SELECT id, festival_id, name, genre, contact_name, contact_email, contact_phone,
               rider_requirements, technical_requirements, fee, fee_status,
               travel_requirements, accommodation_requirements, status,
               created_at, updated_at
        FROM artists 
        ORDER BY name ASC
      `);

      await pool.end();

      return res.status(200).json({
        success: true,
        artists: result.rows
      });
    }

    if (req.method === 'POST') {
      // Create new artist
      const { 
        festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status,
        travel_requirements, accommodation_requirements, status 
      } = req.body;

      const result = await pool.query(`
        INSERT INTO artists (
          festival_id, name, genre, contact_name, contact_email, contact_phone,
          rider_requirements, technical_requirements, fee, fee_status,
          travel_requirements, accommodation_requirements, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        festival_id || 1, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status || 'quoted',
        travel_requirements, accommodation_requirements, status || 'inquired'
      ]);

      await pool.end();

      return res.status(201).json({
        success: true,
        artist: result.rows[0]
      });
    }

    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Artists API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to load artists',
      error: error.message 
    });
  }
}