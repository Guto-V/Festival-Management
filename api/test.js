// Minimal test endpoint for Vercel debugging
export default function handler(req, res) {
  console.log('Test endpoint called');
  
  res.status(200).json({
    status: 'OK',
    message: 'Vercel serverless function working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    method: req.method,
    url: req.url
  });
}