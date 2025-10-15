// System statistics for dashboard
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

    const [
      festivalsResult,
      artistsResult,
      usersResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM festivals'),
      pool.query('SELECT COUNT(*) as count FROM artists'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true')
    ]);

    await pool.end();

    const systemStats = {
      totalFestivals: parseInt(festivalsResult.rows[0].count),
      totalArtists: parseInt(artistsResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count)
    };

    return res.status(200).json({
      success: true,
      stats: systemStats
    });

  } catch (error) {
    console.error('System stats error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to load system statistics',
      error: error.message 
    });
  }
}