import winston from 'winston';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaString}`;
  })
);

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: config.isDevelopment ? developmentFormat : productionFormat,
  defaultMeta: {
    service: 'festival-management',
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: parseInt(config.logging.maxSize.replace('m', '')) * 1024 * 1024,
      maxFiles: config.logging.maxFiles,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: parseInt(config.logging.maxSize.replace('m', '')) * 1024 * 1024,
      maxFiles: config.logging.maxFiles,
    }),
  ],
});

// Add console transport for development
if (config.isDevelopment) {
  logger.add(new winston.transports.Console({
    format: developmentFormat,
  }));
}

// Production console logging (minimal)
if (config.isProduction) {
  logger.add(new winston.transports.Console({
    level: 'error',
    format: winston.format.simple(),
  }));
}

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP request failed', logData);
    } else {
      logger.info('HTTP request', logData);
    }
  });
  
  next();
};

// Database operation logger
export const dbLogger = {
  query: (query: string, params?: any[], duration?: number) => {
    logger.debug('Database query', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      paramCount: params?.length || 0,
      duration: duration ? `${duration}ms` : undefined,
    });
  },
  
  error: (error: Error, query?: string) => {
    logger.error('Database error', {
      error: error.message,
      stack: error.stack,
      query: query?.substring(0, 100),
    });
  },
};

// User action logger
export const auditLogger = {
  login: (userId: number, email: string, success: boolean, ip?: string) => {
    logger.info('User login attempt', {
      userId: success ? userId : undefined,
      email,
      success,
      ip,
      action: 'login',
    });
  },
  
  contractAction: (userId: number, contractId: number, action: string, artistId?: number) => {
    logger.info('Contract action', {
      userId,
      contractId,
      artistId,
      action,
      category: 'contract',
    });
  },
  
  artistAction: (userId: number, artistId: number, action: string, changes?: any) => {
    logger.info('Artist action', {
      userId,
      artistId,
      action,
      changes,
      category: 'artist',
    });
  },
  
  systemAction: (userId: number, action: string, details?: any) => {
    logger.info('System action', {
      userId,
      action,
      details,
      category: 'system',
    });
  },
};

// Error handling
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

export default logger;