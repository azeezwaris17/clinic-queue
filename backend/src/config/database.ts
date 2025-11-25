// backend/src/config/database.ts
/**
 * MongoDB Database Configuration - Production Ready with Environment Support
 * 
 * Handles connection to MongoDB database using Mongoose ODM with
 * environment-specific optimizations for development, production, and test.
 * Includes comprehensive connection lifecycle management, error handling, 
 * and monitoring for the ClinicQueue application.
 */

import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Load environment-specific .env file
 */
const loadEnvironmentConfig = (): void => {
  const env = process.env.NODE_ENV || 'development';
  const envFiles: { [key: string]: string } = {
    development: '.env.development',
    production: '.env.production', 
    test: '.env.test'
  };

  const envFile = envFiles[env] || '.env.development';
  const envPath = path.resolve(process.cwd(), envFile);

  console.log(`📁 Loading environment: ${env} from ${envFile}`);
  
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.warn(`⚠️  Could not load ${envFile}: ${result.error.message}`);
    // Fallback to default .env
    dotenv.config();
  }
};

/**
 * Database configuration based on environment
 */
const DB_CONFIG: { [key: string]: ConnectOptions } = {
  development: {
    autoIndex: true,        // Enable index creation in development
    bufferCommands: false,  // Disable buffering for faster dev feedback
    maxPoolSize: 10,       // Smaller pool for development
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    family: 4,             // Use IPv4, skip trying IPv6
    retryWrites: true,
    retryReads: true
  },
  production: {
    autoIndex: false,      // Disable index creation for performance
    bufferCommands: true,  // Enable buffering in production
    maxPoolSize: 50,       // Larger pool for production
    minPoolSize: 10,       // Maintain minimum connections
    serverSelectionTimeoutMS: 10000, // Longer timeout for production
    socketTimeoutMS: 60000, // Longer socket timeout
    connectTimeoutMS: 10000, // Connection timeout
    family: 4,
    maxIdleTimeMS: 30000,  // Close idle connections after 30s
    retryWrites: true,
    retryReads: true,
    readPreference: 'secondaryPreferred', // Read from secondaries when possible
    w: 'majority',         // Write concern
    journal: true,         // Journal writes for durability
    ssl: true,             // Enable SSL for Atlas
  },
  test: {
    autoIndex: true,
    bufferCommands: false,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  }
};

/**
 * Connection retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
};

/**
 * Database connection statistics interface
 */
interface DatabaseStats {
  readyState: number;
  readyStateDescription: string;
  host: string;
  port: number;
  name: string | null;
  models: string[];
  environment: string;
  connectionPool: {
    maxSize: number;
    currentSize: number | string;
    available: number | string;
  };
  uptime: string;
}

/**
 * Database health check result interface
 */
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: DatabaseStats | { error: string; readyState: number; readyStateDescription: string };
  responseTime?: number;
}

/**
 * Extended Mongoose Connection interface with pool information
 */
interface ConnectionWithPool extends mongoose.Connection {
  poolSize?: number;
}

/**
 * Connection metrics for monitoring
 */
let connectionMetrics = {
  totalConnections: 0,
  failedConnections: 0,
  lastConnectionTime: null as Date | null,
  totalUptime: 0
};

/**
 * Validates MongoDB connection string
 */
const validateConnectionString = (uri: string): boolean => {
  if (!uri) return false;
  
  // Basic MongoDB URI validation
  const mongoUriPattern = /^mongodb(\+srv)?:\/\/.+/;
  if (!mongoUriPattern.test(uri)) {
    return false;
  }

  // Check for credentials in production (should not be hardcoded)
  if (process.env.NODE_ENV === 'production') {
    const hasAtlas = uri.includes('mongodb.net');
    const hasCredentials = uri.includes('@');
    
    if (hasAtlas && !hasCredentials) {
      console.warn('⚠️  Production MongoDB URI missing credentials - using environment variables');
    }
  }

  return true;
};

/**
 * Gets database configuration based on environment
 */
const getDatabaseConfig = (): { uri: string; options: ConnectOptions } => {
  const environment = process.env.NODE_ENV || 'development';
  
  // Get URI from environment with fallbacks
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    // Fallback URIs for different environments
    const fallbackUris: { [key: string]: string } = {
      development: 'mongodb://localhost:27017/clinic_queue_development',
      test: 'mongodb://localhost:27017/clinic_queue_test',
      production: 'mongodb://localhost:27017/clinic_queue' // Should never use fallback in production
    };
    
    uri = fallbackUris[environment];
    console.warn(`⚠️  MONGODB_URI not set, using fallback for ${environment}`);
  }

  // Get options for current environment
  const options = DB_CONFIG[environment as keyof typeof DB_CONFIG] || DB_CONFIG.development;

  return { uri, options };
};

/**
 * Validates environment configuration
 */
const validateEnvironment = (): void => {
  const environment = process.env.NODE_ENV || 'development';
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables for ${environment}:`);
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    
    if (environment === 'production') {
      console.error('💥 Production environment requires all variables to be set!');
      process.exit(1);
    } else {
      console.warn('⚠️  Development/Test environment - using fallbacks');
    }
  }
};

/**
 * Establishes connection to MongoDB database with environment-specific configuration
 * @throws {Error} If connection fails after retries
 */
export const connectDB = async (): Promise<void> => {
  let retries = 0;
  
  // Load environment config first
  loadEnvironmentConfig();
  
  // Validate environment configuration
  validateEnvironment();
  
  while (retries < RETRY_CONFIG.maxRetries) {
    try {
      const { uri, options } = getDatabaseConfig();
      
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      // Validate connection string
      if (!validateConnectionString(uri)) {
        throw new Error('Invalid MongoDB connection string format');
      }

      const environment = process.env.NODE_ENV || 'development';
      
      console.log(`🔗 Connecting to ${environment} database (attempt ${retries + 1}/${RETRY_CONFIG.maxRetries})...`);
      console.log(`📁 Database: ${process.env.DB_NAME || 'default'}`);
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        throw new Error(`Database connection timeout after ${options.serverSelectionTimeoutMS}ms`);
      }, options.serverSelectionTimeoutMS);

      // Attempt database connection with environment-specific options
      await mongoose.connect(uri, options);
      clearTimeout(connectionTimeout);
      
      // Update connection metrics
      connectionMetrics.totalConnections++;
      connectionMetrics.lastConnectionTime = new Date();
      
      console.log('✅ MongoDB connected successfully');
      
      // Safe database name access with null check
      const dbName = mongoose.connection.db?.databaseName || 'unknown';
      console.log(`📁 Connected to: ${dbName}`);
      console.log(`🏠 Host: ${mongoose.connection.host}`);
      console.log(`⚡ Environment: ${environment}`);
      
      // Set up connection event handlers
      setupConnectionEventHandlers();
      
      return; // Success, exit retry loop
      
    } catch (error: unknown) {
      retries++;
      connectionMetrics.failedConnections++;
      
      if (retries >= RETRY_CONFIG.maxRetries) {
        console.error(`❌ MongoDB connection failed after ${RETRY_CONFIG.maxRetries} attempts:`);
        
        if (error instanceof Error) {
          console.error('   Error:', error.message);
        } else {
          console.error('   Error:', String(error));
        }
        
        console.error('   Please check:');
        console.error('   1. MONGODB_URI is set correctly');
        console.error('   2. MongoDB Atlas cluster is running');
        console.error('   3. Network access is configured in Atlas');
        console.error('   4. Database user credentials are correct');
        console.error('   5. IP is whitelisted in Atlas');
        console.error('   6. SSL certificates are valid');
        
        // Exit process with failure code if database connection fails
        process.exit(1);
      } else {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retries - 1);
        console.warn(`⚠️  Connection attempt ${retries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

/**
 * Gracefully closes database connection
 * Useful for cleanup during application shutdown
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    console.log('🛑 Closing database connection gracefully...');
    
    // Set a timeout for graceful shutdown
    const shutdownTimeout = setTimeout(() => {
      console.warn('⚠️  Force closing database connection...');
      process.exit(1);
    }, 10000); // 10 second timeout
    
    await mongoose.disconnect();
    clearTimeout(shutdownTimeout);
    
    console.log('✅ MongoDB disconnected successfully');
  } catch (error: unknown) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Sets up event handlers for MongoDB connection lifecycle
 */
const setupConnectionEventHandlers = (): void => {
  const connection = mongoose.connection;
  
  // Handle connection errors after initial connection
  connection.on('error', (error: Error) => {
    console.error('❌ MongoDB connection error:', error.message);
    connectionMetrics.failedConnections++;
  });
  
  // Handle connection disconnection
  connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected - attempting to reconnect...');
  });
  
  // Handle connection reconnected
  connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully');
    connectionMetrics.totalConnections++;
  });
  
  // Handle connection opening
  connection.on('connected', () => {
    console.log('🔗 MongoDB connection established');
  });

  // Handle connection timeout
  connection.on('timeout', () => {
    console.error('⏰ MongoDB connection timeout');
  });
  
  // Handle process termination for graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal} signal - closing database connection gracefully...`);
    await disconnectDB();
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
};

/**
 * Checks if database connection is healthy
 * @returns {boolean} Connection status
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

/**
 * Gets database connection statistics
 * @returns {DatabaseStats} Connection metrics
 */
export const getDatabaseStats = (): DatabaseStats => {
  const connection = mongoose.connection as ConnectionWithPool;
  const db = connection.db;
  
  const startTime = connectionMetrics.lastConnectionTime;
  const uptime = startTime ? Date.now() - startTime.getTime() : 0;
  
  return {
    readyState: connection.readyState,
    readyStateDescription: getReadyStateDescription(connection.readyState),
    host: connection.host,
    port: connection.port,
    name: db?.databaseName || null,
    models: Object.keys(connection.models),
    environment: process.env.NODE_ENV || 'development',
    connectionPool: {
      maxSize: DB_CONFIG[process.env.NODE_ENV as keyof typeof DB_CONFIG]?.maxPoolSize || 20,
      currentSize: connection.poolSize || 'unknown',
      available: 'unknown' // Mongoose doesn't expose this directly
    },
    uptime: formatUptime(uptime)
  };
};

/**
 * Helper function to describe connection state
 */
const getReadyStateDescription = (readyState: number): string => {
  switch (readyState) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
};

/**
 * Format uptime for display
 */
const formatUptime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Health check for database connection
 * @returns {Promise<HealthCheckResult>} Health status
 */
export const checkDatabaseHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  
  try {
    const isConnected = isDatabaseConnected();
    
    if (!isConnected) {
      return {
        status: 'unhealthy',
        details: {
          error: 'Database not connected',
          readyState: mongoose.connection.readyState,
          readyStateDescription: getReadyStateDescription(mongoose.connection.readyState)
        },
        responseTime: Date.now() - startTime
      };
    }

    // Perform a simple query to verify database responsiveness
    const db = mongoose.connection.db;
    if (!db) {
      return {
        status: 'unhealthy',
        details: {
          error: 'Database instance not available',
          readyState: mongoose.connection.readyState,
          readyStateDescription: getReadyStateDescription(mongoose.connection.readyState)
        },
        responseTime: Date.now() - startTime
      };
    }

    const pingResult = await db.admin().ping();
    const responseTime = Date.now() - startTime;

    if (pingResult.ok !== 1) {
      return {
        status: 'degraded',
        details: {
          error: 'Database ping failed',
          readyState: mongoose.connection.readyState,
          readyStateDescription: getReadyStateDescription(mongoose.connection.readyState)
        },
        responseTime
      };
    }

    // Check if response time is acceptable
    const isDegraded = responseTime > 1000; // More than 1 second is degraded
    
    return {
      status: isDegraded ? 'degraded' : 'healthy',
      details: getDatabaseStats(),
      responseTime
    };
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      status: 'unhealthy',
      details: {
        error: errorMessage,
        readyState: mongoose.connection.readyState,
        readyStateDescription: getReadyStateDescription(mongoose.connection.readyState)
      },
      responseTime: Date.now() - startTime
    };
  }
};

/**
 * Get connection metrics for monitoring
 */
export const getConnectionMetrics = () => {
  return {
    ...connectionMetrics,
    successRate: connectionMetrics.totalConnections > 0 
      ? ((connectionMetrics.totalConnections - connectionMetrics.failedConnections) / connectionMetrics.totalConnections * 100).toFixed(2)
      : 0
  };
};

/**
 * Reset connection metrics (useful for testing)
 */
export const resetConnectionMetrics = (): void => {
  connectionMetrics = {
    totalConnections: 0,
    failedConnections: 0,
    lastConnectionTime: null,
    totalUptime: 0
  };
};