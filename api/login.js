// Login endpoint for frontend
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

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
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Connect to database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Find user
    const userResult = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    await pool.end();

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const user = userResult.rows[0];

    // For the default admin user, check if it's the default password
    let isValidPassword = false;
    if (email === 'admin@festival.com' && password === 'admin123') {
      isValidPassword = true;
    } else {
      // For other users, check the hashed password
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash);
      } catch (error) {
        console.error('Password comparison error:', error);
        isValidPassword = false;
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Create a simple token (for testing - in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      timestamp: Date.now()
    })).toString('base64');

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
      token: token
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