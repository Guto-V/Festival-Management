// Database connection test endpoint
export default async function handler(req, res) {
  try {
    console.log('=== Database Test Debug ===');
    
    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL;
    const nodeEnv = process.env.NODE_ENV;
    
    console.log('NODE_ENV:', nodeEnv);
    console.log('DATABASE_URL exists:', !!databaseUrl);
    console.log('DATABASE_URL preview:', databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'NOT SET');
    
    const response = {
      status: 'Database Test',
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      databaseUrl: {
        exists: !!databaseUrl,
        preview: databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'NOT SET',
        isPostgres: databaseUrl ? databaseUrl.includes('postgresql') : false,
        hasPassword: databaseUrl ? !databaseUrl.includes('[YOUR-PASSWORD]') : false
      }
    };
    
    // Try a simple database connection test
    if (databaseUrl && databaseUrl.includes('postgresql')) {
      try {
        // Import pg dynamically (it might not be available in serverless)
        const { Pool } = await import('pg');
        
        const pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });
        
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        client.release();
        await pool.end();
        
        response.databaseTest = {
          status: 'SUCCESS',
          currentTime: result.rows[0].current_time,
          postgresVersion: result.rows[0].postgres_version.substring(0, 50)
        };
        
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        response.databaseTest = {
          status: 'ERROR',
          error: dbError.message,
          code: dbError.code
        };
      }
    } else {
      response.databaseTest = {
        status: 'SKIPPED',
        reason: 'No valid PostgreSQL URL found'
      };
    }
    
    console.log('Database test response:', response);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Database test endpoint error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}