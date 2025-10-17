// Auth endpoint (login and profile)
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle profile requests
  const url = req.url || '';
  if (req.method === 'GET' || url.includes('profile')) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No authorization token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token.startsWith('auth-token-') || token.startsWith('auth-login-token-')) {
      return res.status(200).json({
        success: true,
        user: {
          id: 1,
          email: 'admin@festival.com',
          first_name: 'Admin',
          last_name: 'User',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        }
      });
    }

    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }

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