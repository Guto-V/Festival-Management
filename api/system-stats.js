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

    // Get system statistics
    const [
      festivalsResult,
      artistsResult,
      performancesResult,
      usersResult,
      volunteersResult,
      vendorsResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM festivals'),
      pool.query('SELECT COUNT(*) as count FROM artists'),
      pool.query('SELECT COUNT(*) as count FROM performances'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM volunteers'),
      pool.query('SELECT COUNT(*) as count FROM vendors')
    ]);

    // Get recent activity
    const recentArtists = await pool.query(`
      SELECT name, status, created_at 
      FROM artists 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    const recentPerformances = await pool.query(`
      SELECT p.id, a.name as artist_name, p.performance_date, p.start_time, p.status
      FROM performances p
      JOIN artists a ON p.artist_id = a.id
      ORDER BY p.created_at DESC 
      LIMIT 5
    `);

    await pool.end();

    const systemStats = {
      totalFestivals: parseInt(festivalsResult.rows[0].count),
      totalArtists: parseInt(artistsResult.rows[0].count),
      totalPerformances: parseInt(performancesResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      totalVolunteers: parseInt(volunteersResult.rows[0].count),
      totalVendors: parseInt(vendorsResult.rows[0].count),
      recentArtists: recentArtists.rows,
      recentPerformances: recentPerformances.rows
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