#!/usr/bin/env node

// Generate a secure JWT secret for production
const crypto = require('crypto');

function generateJWTSecret() {
  // Generate 32 bytes (256 bits) of random data
  const secret = crypto.randomBytes(32).toString('hex');
  
  console.log('🔐 Generated JWT Secret:');
  console.log(secret);
  console.log('');
  console.log('📋 Copy this to your Vercel environment variables:');
  console.log(`JWT_SECRET=${secret}`);
  console.log('');
  console.log('⚠️  Keep this secret secure and never share it publicly!');
}

generateJWTSecret();