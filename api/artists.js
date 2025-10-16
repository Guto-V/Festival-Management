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
      const { festival_id } = req.query;
      
      let query = `
        SELECT id, festival_id, name, genre, contact_name, contact_email, contact_phone,
               rider_requirements, technical_requirements, fee, fee_status,
               travel_requirements, accommodation_requirements, status,
               created_at, updated_at
        FROM artists 
      `;
      
      const params = [];
      if (festival_id) {
        query += ' WHERE festival_id = $1';
        params.push(festival_id);
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await pool.query(query, params);
      await pool.end();
      
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
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
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { 
        festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status,
        travel_requirements, accommodation_requirements, status 
      } = req.body;

      const result = await pool.query(`
        UPDATE artists SET
          festival_id = $1, name = $2, genre = $3, contact_name = $4, 
          contact_email = $5, contact_phone = $6, rider_requirements = $7,
          technical_requirements = $8, fee = $9, fee_status = $10,
          travel_requirements = $11, accommodation_requirements = $12, 
          status = $13, updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING *
      `, [
        festival_id, name, genre, contact_name, contact_email, contact_phone,
        rider_requirements, technical_requirements, fee, fee_status,
        travel_requirements, accommodation_requirements, status, id
      ]);

      await pool.end();
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      await pool.query('DELETE FROM artists WHERE id = $1', [id]);
      await pool.end();
      
      return res.status(200).json({ success: true });
    }

    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Artists API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process artists request',
      error: error.message 
    });
  }
}