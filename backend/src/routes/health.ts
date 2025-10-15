import express from 'express';
import { getUniversalDatabase } from '../utils/database-universal';
import { config } from '../config';
// Logger temporarily disabled
import fs from 'fs';
import path from 'path';

const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: string;
  checks: {
    database: HealthCheck;
    filesystem: HealthCheck;
    memory: HealthCheck;
    config: HealthCheck;
  };
  metrics?: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: string;
  details?: any;
}

// Detailed health check
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    database: await checkDatabase(),
    filesystem: await checkFilesystem(),
    memory: checkMemory(),
    config: checkConfiguration(),
  };
  
  // Determine overall status
  const hasFailures = Object.values(checks).some(check => check.status === 'fail');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
  
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (hasFailures) {
    overallStatus = 'unhealthy';
  } else if (hasWarnings) {
    overallStatus = 'degraded';
  }
  
  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.8.1',
    environment: config.nodeEnv,
    uptime: formatUptime(process.uptime()),
    checks,
  };
  
  // Add detailed metrics in development
  if (config.isDevelopment) {
    response.metrics = {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }
  
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;
  
  // Log health check results
  if (overallStatus !== 'healthy') {
    console.warn('Health check failed', {
      status: overallStatus,
      duration: `${Date.now() - startTime}ms`,
      failures: Object.entries(checks)
        .filter(([, check]) => check.status !== 'pass')
        .map(([name, check]) => ({ name, status: check.status, message: check.message })),
    });
  }
  
  res.status(httpStatus).json(response);
});

// Simple liveness probe (for load balancers)
router.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.8.4',
  });
});

// Basic health check without database (for Vercel debugging)
router.get('/health/basic', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    databaseType: process.env.DATABASE_URL ? 'postgresql' : 'sqlite',
    databaseConfigured: !!process.env.DATABASE_URL,
    version: '1.8.4',
    uptime: process.uptime(),
  });
});

// Readiness probe (checks dependencies)
router.get('/health/ready', async (req, res) => {
  const dbCheck = await checkDatabase();
  const fsCheck = await checkFilesystem();
  
  const isReady = dbCheck.status === 'pass' && fsCheck.status === 'pass';
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbCheck,
      filesystem: fsCheck,
    },
  });
});

// Health check functions
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const db = getUniversalDatabase();
    await db.get('SELECT 1 as health_check');
    
    // Check if main tables exist
    const tablesResult = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('users', 'festivals', 'artists')
    `);
    
    if (!tablesResult) {
      return {
        status: 'warn',
        message: 'Database connected but tables not initialized',
        duration: `${Date.now() - start}ms`,
      };
    }
    
    return {
      status: 'pass',
      message: 'Database connection successful',
      duration: `${Date.now() - start}ms`,
    };
  } catch (error: any) {
    console.error('Database health check failed', error.message);
    return {
      status: 'fail',
      message: `Database connection failed: ${error.message}`,
      duration: `${Date.now() - start}ms`,
    };
  }
}

async function checkFilesystem(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Check if required directories exist and are writable
    const requiredDirs = [
      path.dirname(config.logging.file),
      config.storage.localPath,
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Test write access
      const testFile = path.join(dir, '.health-check');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    }
    
    return {
      status: 'pass',
      message: 'Filesystem access verified',
      duration: `${Date.now() - start}ms`,
    };
  } catch (error: any) {
    return {
      status: 'fail',
      message: `Filesystem access failed: ${error.message}`,
      duration: `${Date.now() - start}ms`,
    };
  }
}

function checkMemory(): HealthCheck {
  const usage = process.memoryUsage();
  const totalMemory = usage.rss + usage.heapUsed + usage.external;
  const memoryLimitMB = 512; // Alert if using more than 512MB
  const memoryUsedMB = Math.round(totalMemory / 1024 / 1024);
  
  if (memoryUsedMB > memoryLimitMB) {
    return {
      status: 'warn',
      message: `High memory usage: ${memoryUsedMB}MB`,
      details: { memoryUsedMB, memoryLimitMB },
    };
  }
  
  return {
    status: 'pass',
    message: `Memory usage normal: ${memoryUsedMB}MB`,
    details: { memoryUsedMB },
  };
}

function checkConfiguration(): HealthCheck {
  const issues: string[] = [];
  
  // Check for production-ready configuration
  if (config.isProduction) {
    if (config.jwt.secret === 'dev-secret-key-change-in-production') {
      issues.push('JWT secret not changed from default');
    }
    
    if (!config.database.url.includes('postgresql')) {
      issues.push('Using SQLite in production (consider PostgreSQL)');
    }
    
    if (config.cors.origin === 'http://localhost:3000') {
      issues.push('CORS origin not configured for production');
    }
  }
  
  if (issues.length > 0) {
    return {
      status: 'warn',
      message: `Configuration issues: ${issues.join(', ')}`,
      details: { issues },
    };
  }
  
  return {
    status: 'pass',
    message: 'Configuration validated',
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export default router;