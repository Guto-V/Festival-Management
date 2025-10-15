// IPv6 database connection test
import { Pool } from 'pg';

export default async function handler(req, res) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    const response = {
      status: 'IPv6 Database Connection Test',
      timestamp: new Date().toISOString(),
      tests: {}
    };

    if (!databaseUrl) {
      return res.status(400).json({
        error: 'DATABASE_URL not configured'
      });
    }

    // Test 1: Force IPv6 connection
    try {
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        // Force IPv6
        host: '[2a05:d01c:30c:9d0d:604c:883a:a907:5fd]',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'dahtUj-sofdiq-9rokpy',
        connectTimeoutMillis: 15000
      });

      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      client.release();
      await pool.end();

      response.tests.ipv6Direct = {
        status: 'SUCCESS',
        message: 'IPv6 direct connection successful',
        currentTime: result.rows[0].current_time,
        version: result.rows[0].postgres_version.substring(0, 50)
      };

    } catch (error) {
      response.tests.ipv6Direct = {
        status: 'ERROR',
        error: error.message,
        code: error.code
      };
    }

    // Test 2: Try connection with family option
    try {
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        // Node.js net options
        options: {
          family: 6  // Force IPv6
        },
        connectTimeoutMillis: 15000
      });

      const client = await pool.connect();
      const result = await client.query('SELECT 1 as test');
      client.release();
      await pool.end();

      response.tests.ipv6Family = {
        status: 'SUCCESS',
        message: 'IPv6 family option successful'
      };

    } catch (error) {
      response.tests.ipv6Family = {
        status: 'ERROR',
        error: error.message,
        code: error.code
      };
    }

    // Test 3: Check if we can create a modified connection string
    const originalUrl = new URL(databaseUrl);
    const ipv6Url = databaseUrl.replace(
      originalUrl.hostname, 
      `[2a05:d01c:30c:9d0d:604c:883a:a907:5fd]`
    );
    
    try {
      const pool = new Pool({
        connectionString: ipv6Url,
        ssl: { rejectUnauthorized: false },
        connectTimeoutMillis: 15000
      });

      const client = await pool.connect();
      const result = await client.query('SELECT 1 as test');
      client.release();
      await pool.end();

      response.tests.ipv6Url = {
        status: 'SUCCESS',
        message: 'IPv6 URL replacement successful',
        modifiedUrl: ipv6Url.substring(0, 50) + '...'
      };

    } catch (error) {
      response.tests.ipv6Url = {
        status: 'ERROR',
        error: error.message,
        code: error.code
      };
    }

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}