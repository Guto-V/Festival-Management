// Simple health check endpoint for Vercel
export default function handler(req, res) {
  try {
    console.log('Health endpoint called');
    
    const response = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.8.4',
      databaseConfigured: !!process.env.DATABASE_URL,
      databaseType: process.env.DATABASE_URL ? 'postgresql' : 'sqlite',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    
    console.log('Health check response:', response);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}