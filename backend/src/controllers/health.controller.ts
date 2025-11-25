import { Request, Response } from 'express';
import { checkDatabaseHealth, getDatabaseStats, isDatabaseConnected } from '../config/database';

/**
 * Health check controller
 */
export const healthCheck = async (_req: Request, res: Response) => {
  try {
    // Use the existing database health check from your config
    const dbHealth = await checkDatabaseHealth();
    
    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      database: dbHealth,
      memory: {
        usage: process.memoryUsage(),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
    };

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    
    console.log('✅ Health check completed - SENDING RESPONSE');
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Simple health check (lightweight version)
 */
export const simpleHealthCheck = async (_req: Request, res: Response) => {
  try {
    const isConnected = isDatabaseConnected();
    const dbStats = getDatabaseStats();
    
    const healthStatus = {
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        state: dbStats.readyStateDescription,
        host: dbStats.host,
        name: dbStats.name
      },
      uptime: process.uptime()
    };

    const statusCode = isConnected ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('❌ Simple health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};