// Auth profile endpoint
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

  // For now, always return the admin user since we're using simple auth
  // In a real app, you'd validate the JWT token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'No authorization token provided' 
    });
  }

  // Simple token validation - in production you'd verify JWT
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