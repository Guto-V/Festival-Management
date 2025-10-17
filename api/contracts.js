// Contracts and Templates API endpoint (consolidated)
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

    // Handle contract templates
    if (url.includes('templates')) {
      // Create contract_templates table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS contract_templates (
          id SERIAL PRIMARY KEY,
          festival_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          template_content TEXT NOT NULL,
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      if (req.method === 'GET') {
        const { festival_id } = req.query;
        
        let query = 'SELECT * FROM contract_templates';
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
        const { festival_id, name, description, template_content, is_default } = req.body;

        const result = await pool.query(`
          INSERT INTO contract_templates (festival_id, name, description, template_content, is_default)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [festival_id || 1, name, description, template_content, is_default || false]);

        await pool.end();
        return res.status(201).json(result.rows[0]);
      }

      if (req.method === 'PUT') {
        const urlParts = url.split('/');
        const id = urlParts[urlParts.length - 1];
        const { name, description, template_content, is_default } = req.body;

        const result = await pool.query(`
          UPDATE contract_templates SET
            name = $1, description = $2, template_content = $3, 
            is_default = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *
        `, [name, description, template_content, is_default, id]);

        await pool.end();
        return res.status(200).json(result.rows[0]);
      }

      if (req.method === 'DELETE') {
        const urlParts = url.split('/');
        const id = urlParts[urlParts.length - 1];
        
        await pool.query('DELETE FROM contract_templates WHERE id = $1', [id]);
        await pool.end();
        
        return res.status(200).json({ success: true });
      }

      await pool.end();
    }

    // Default contracts behavior (for future contracts functionality)
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }

    if (req.method === 'POST') {
      return res.status(201).json({ id: Date.now(), ...req.body });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Contracts API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process contracts request',
      error: error.message 
    });
  }
}