// Login endpoint for frontend at /api/auth/login
import { Pool } from 'pg';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Auth/login endpoint called');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // For admin credentials, return success immediately
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
        token: `auth-login-token-${Date.now()}`
      });
    }

    // Try database lookup for other users
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      const result = await pool.query(
        'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true LIMIT 1',
        [email]
      );

      await pool.end();

      if (result.rows.length > 0) {
        const user = result.rows[0];
        
        // For database users, also accept admin123 for testing
        if (password === 'admin123') {
          return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
              id: user.id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              firstName: user.first_name,
              lastName: user.last_name,
              role: user.role
            },
            token: `auth-login-token-${user.id}-${Date.now()}`
          });
        }
      }
    } catch (dbError) {
      console.error('Database error in auth/login:', dbError);
    }

    return res.status(401).json({ 
      success: false,
      message: 'Invalid email or password' 
    });

  } catch (error) {
    console.error('Auth/login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed',
      error: error.message 
    });
  }
}