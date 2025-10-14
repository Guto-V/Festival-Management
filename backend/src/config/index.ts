import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./festival.db',
    type: process.env.DATABASE_URL ? 'postgresql' : 'sqlite',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256' as const,
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  
  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'console', // 'console' for dev, 'sendgrid' for prod
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@festival.local',
    fromName: process.env.EMAIL_FROM_NAME || 'Festival Management System',
  },
  
  // File storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'local' for dev, 's3' for prod
    s3Bucket: process.env.S3_BUCKET || '',
    s3Region: process.env.S3_REGION || 'us-east-1',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    file: process.env.LOG_FILE || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
  },
  
  // Security configuration
  security: {
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  
  // Feature flags
  features: {
    enableContractSigning: process.env.ENABLE_CONTRACT_SIGNING !== 'false',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableFileUploads: process.env.ENABLE_FILE_UPLOADS !== 'false',
    maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB
  },
  
  // Development specific
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validation
if (config.isProduction) {
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  
  if (config.jwt.secret === 'dev-secret-key-change-in-production') {
    console.error('❌ JWT_SECRET must be changed for production');
    process.exit(1);
  }
}

console.log('🔧 Configuration loaded:', {
  environment: config.nodeEnv,
  port: config.port,
  database: config.database.type,
  features: Object.entries(config.features)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name),
});