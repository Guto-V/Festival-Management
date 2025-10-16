// Stages and Areas API endpoint
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    const { name, capacity, type, location, description } = req.body;
    return res.status(201).json({ 
      id: Date.now(), 
      name, 
      capacity, 
      type, 
      location, 
      description,
      created_at: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}