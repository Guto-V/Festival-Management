// Simple auth test endpoint
import { Pool } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Auth endpoint called');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Test database connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Try to find user
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true LIMIT 1',
      [email]
    );

    await pool.end();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // For testing, accept the default password
    if (email === 'admin@festival.com' && password === 'admin123') {
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token: 'test-token-for-now'
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
}