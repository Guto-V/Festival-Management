// Enhanced database debug endpoint
import { Pool } from 'pg';

export default async function handler(req, res) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    // Parse the URL to show components
    let urlInfo = {};
    if (databaseUrl) {
      try {
        const url = new URL(databaseUrl);
        urlInfo = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          hasPassword: !url.password?.includes('[YOUR-PASSWORD]')
        };
      } catch (e) {
        urlInfo.error = 'Invalid URL format';
      }
    }

    const response = {
      status: 'Enhanced Database Debug',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      urlInfo,
      tests: {}
    };

    // Test 1: Basic DNS resolution (using fetch to external service)
    try {
      // Test if we can resolve DNS using a simple HTTP request
      const dnsTest = await fetch('https://httpbin.org/ip', { 
        signal: AbortSignal.timeout(5000) 
      });
      response.tests.dnsTest = {
        status: 'SUCCESS',
        message: 'External DNS resolution works'
      };
    } catch (e) {
      response.tests.dnsTest = {
        status: 'ERROR',
        message: 'External DNS resolution failed: ' + e.message
      };
    }

    // Test 2: Supabase connection with different approaches
    if (databaseUrl && urlInfo.hasPassword) {
      // Try with different SSL configurations
      const sslConfigs = [
        { rejectUnauthorized: false },
        { rejectUnauthorized: true },
        false
      ];

      for (let i = 0; i < sslConfigs.length; i++) {
        const sslConfig = sslConfigs[i];
        try {
          const pool = new Pool({
            connectionString: databaseUrl,
            ssl: sslConfig,
            connectTimeoutMillis: 10000,
            idleTimeoutMillis: 5000
          });

          const client = await pool.connect();
          const result = await client.query('SELECT NOW() as test_time');
          client.release();
          await pool.end();

          response.tests[`connectionTest_${i}`] = {
            status: 'SUCCESS',
            sslConfig: sslConfig,
            testTime: result.rows[0].test_time,
            message: 'Database connection successful'
          };
          break; // Stop on first success

        } catch (error) {
          response.tests[`connectionTest_${i}`] = {
            status: 'ERROR',
            sslConfig: sslConfig,
            error: error.message,
            code: error.code
          };
        }
      }
    } else {
      response.tests.connectionTest = {
        status: 'SKIPPED',
        reason: 'Invalid or incomplete DATABASE_URL'
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