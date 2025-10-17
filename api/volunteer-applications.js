// Volunteer applications API endpoint
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

    // Create volunteer_applications table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS volunteer_applications (
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

    if (req.method === 'GET') {
      const { festival_id } = req.query;
      
      let query = 'SELECT * FROM volunteer_applications';
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
        festival_id, first_name, last_name, email, phone,
        emergency_contact_name, emergency_contact_phone, availability,
        skills, experience, dietary_requirements, accommodation_needed,
        transport_needed, status, notes
      } = req.body;

      const result = await pool.query(`
        INSERT INTO volunteer_applications (
          festival_id, first_name, last_name, email, phone,
          emergency_contact_name, emergency_contact_phone, availability,
          skills, experience, dietary_requirements, accommodation_needed,
          transport_needed, status, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        festival_id || 1, first_name, last_name, email, phone,
        emergency_contact_name, emergency_contact_phone, availability,
        skills, experience, dietary_requirements, accommodation_needed || false,
        transport_needed || false, status || 'pending', notes
      ]);

      await pool.end();
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const url = req.url || '';
      const urlParts = url.split('/');
      
      // Handle approve/decline actions
      if (url.includes('/approve')) {
        const id = urlParts[urlParts.length - 2];
        const result = await pool.query(`
          UPDATE volunteer_applications SET 
            status = 'approved', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `, [id]);
        
        await pool.end();
        return res.status(200).json(result.rows[0]);
      }
      
      if (url.includes('/decline')) {
        const id = urlParts[urlParts.length - 2];
        const result = await pool.query(`
          UPDATE volunteer_applications SET 
            status = 'declined', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `, [id]);
        
        await pool.end();
        return res.status(200).json(result.rows[0]);
      }

      // Regular update
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
        UPDATE volunteer_applications SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${fields.length + 1}
        RETURNING *
      `, [...values, id]);

      await pool.end();
      return res.status(200).json(result.rows[0]);
    }

    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Volunteer applications API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process volunteer application request',
      error: error.message 
    });
  }
}