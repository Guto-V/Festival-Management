// Simplified login endpoint without bcrypt
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
    console.log('Simple login endpoint called');
    console.log('Request body:', req.body);

    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // For testing, just check the admin credentials without database
    if (email === 'admin@festival.com' && password === 'admin123') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          email: 'admin@festival.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        },
        token: 'test-token-123'
      });
    }

    // Try to connect to database to get real user
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      const userResult = await pool.query(
        'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      await pool.end();

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        // For any database user with admin@festival.com and password admin123
        if (email === 'admin@festival.com' && password === 'admin123') {
          return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              role: user.role
            },
            token: `token-${user.id}-${Date.now()}`
          });
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fall back to hardcoded admin if database fails
      if (email === 'admin@festival.com' && password === 'admin123') {
        return res.status(200).json({
          success: true,
          message: 'Login successful (fallback)',
          user: {
            id: 1,
            email: 'admin@festival.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          },
          token: 'fallback-token-123'
        });
      }
    }

    return res.status(401).json({ 
      success: false,
      message: 'Invalid email or password' 
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}