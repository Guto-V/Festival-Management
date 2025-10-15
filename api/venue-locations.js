// Venue locations API endpoint
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

    // Return empty array for now, as venue-locations table doesn't exist yet
    await pool.end();
    
    return res.status(200).json([]);

  } catch (error) {
    console.error('Venue locations API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to load venue locations',
      error: error.message 
    });
  }
}