// Consolidated API router for all endpoints
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
  const path = url.split('?')[0]; // Remove query params

  try {
    // Route to different handlers based on path
    if (path === '/api/auth/login' || path === '/api/auth') {
      return await handleAuth(req, res);
    }
    if (path === '/api/festivals') {
      return await handleFestivals(req, res);
    }
    if (path === '/api/artists') {
      return await handleArtists(req, res);
    }
    if (path === '/api/system-stats') {
      return await handleSystemStats(req, res);
    }
    if (path === '/api/health') {
      return await handleHealth(req, res);
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}

// Auth handler
async function handleAuth(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email and password are required' 
    });
  }

  // For admin credentials
  if (email === 'admin@festival.com' && password === 'admin123') {
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: 1,
        email: 'admin@festival.com',
        first_name: 'Admin',
        last_name: 'User',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      },
      token: `auth-token-${Date.now()}`
    });
  }

  return res.status(401).json({ 
    success: false,
    message: 'Invalid email or password' 
  });
}

// Festivals handler
async function handleFestivals(req, res) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  if (req.method === 'GET') {
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

  await pool.end();
  return res.status(405).json({ error: 'Method not allowed' });
}

// Artists handler
async function handleArtists(req, res) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  if (req.method === 'GET') {
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

  await pool.end();
  return res.status(405).json({ error: 'Method not allowed' });
}

// System stats handler
async function handleSystemStats(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}

// Health handler
async function handleHealth(req, res) {
  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.8.4'
  });
}