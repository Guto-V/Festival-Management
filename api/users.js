// Users API endpoint
import { Pool } from 'pg';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query(`
      SELECT id, email, first_name, last_name, role, is_active,
             created_at, updated_at
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    await pool.end();

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to load users',
      error: error.message 
    });
  }
}