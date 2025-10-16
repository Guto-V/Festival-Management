// Vendors and Volunteers API endpoint (consolidated)
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  
  // Handle both vendors and volunteers requests
  if (url.includes('volunteers')) {
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    if (req.method === 'POST') {
      return res.status(201).json({ id: Date.now(), type: 'volunteer', ...req.body });
    }
  }

  // Default to vendors behavior
  if (req.method === 'GET') {
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    return res.status(201).json({ id: Date.now(), type: 'vendor', ...req.body });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}