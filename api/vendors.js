// Vendors and Volunteers API endpoint (consolidated)
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
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Handle volunteers requests
    if (url.includes('volunteers')) {
      // Create volunteers table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS volunteers (
          id SERIAL PRIMARY KEY,
          festival_id INTEGER NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          role VARCHAR(255),
          shift_date DATE,
          shift_start_time TIME,
          shift_end_time TIME,
          emergency_contact_name VARCHAR(255),
          emergency_contact_phone VARCHAR(50),
          dietary_requirements TEXT,
          status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'completed')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      if (req.method === 'GET') {
        const { festival_id } = req.query;
        
        let query = 'SELECT * FROM volunteers';
        const params = [];
        
        if (festival_id) {
          query += ' WHERE festival_id = $1';
          params.push(festival_id);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        await pool.end();
        
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const {
          festival_id, first_name, last_name, email, phone, role,
          shift_date, shift_start_time, shift_end_time,
          emergency_contact_name, emergency_contact_phone,
          dietary_requirements, status, notes
        } = req.body;

        const result = await pool.query(`
          INSERT INTO volunteers (
            festival_id, first_name, last_name, email, phone, role,
            shift_date, shift_start_time, shift_end_time,
            emergency_contact_name, emergency_contact_phone,
            dietary_requirements, status, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `, [
          festival_id || 1, first_name, last_name, email, phone, role,
          shift_date, shift_start_time, shift_end_time,
          emergency_contact_name, emergency_contact_phone,
          dietary_requirements, status || 'active', notes
        ]);

        await pool.end();
        return res.status(201).json(result.rows[0]);
      }

      if (req.method === 'PUT') {
        const urlParts = url.split('/');
        const id = urlParts[urlParts.length - 1];
        const updateData = req.body;
        
        const fields = Object.keys(updateData).filter(key => key !== 'id');
        const values = fields.map(field => updateData[field]);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        
        if (fields.length === 0) {
          await pool.end();
          return res.status(400).json({ error: 'No fields to update' });
        }
        
        const result = await pool.query(`
          UPDATE volunteers SET ${setClause}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${fields.length + 1}
          RETURNING *
        `, [...values, id]);

        await pool.end();
        return res.status(200).json(result.rows[0]);
      }

      await pool.end();
    }

    // Default to vendors behavior (simplified for now)
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }

    if (req.method === 'POST') {
      return res.status(201).json({ id: Date.now(), type: 'vendor', ...req.body });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Vendors/Volunteers API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process vendors/volunteers request',
      error: error.message 
    });
  }
}