// Schedule and Budget API endpoint (consolidated)
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  
  // Handle both /api/schedule and /api/budget requests
  if (url.includes('budget')) {
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    if (req.method === 'POST') {
      return res.status(201).json({ id: Date.now(), ...req.body });
    }
  }

  // Default to schedule behavior
  if (req.method === 'GET') {
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    return res.status(201).json({ id: Date.now(), ...req.body });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}