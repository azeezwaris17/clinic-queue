// backend/src/utils/env.ts
/**
 * Environment Configuration Utility
 * 
 * Handles environment-specific configuration and validation
 */

export const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('💡 Please check your .env file or environment configuration');
    process.exit(1);
  }

  // Validate JWT secret length in production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long in production');
    process.exit(1);
  }

  console.log(`✅ Environment validation passed - Running in ${process.env.NODE_ENV} mode`);
};

export const getEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    database: process.env.DB_NAME || 'clinic_queue_development',
    frontendUrl: process.env.FRONTEND_URL,
    debug: process.env.DEBUG === 'true',
    logLevel: process.env.LOG_LEVEL || 'info'
  };
};