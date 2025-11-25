import { Request, Response } from 'express';

/**
 * Test endpoint controller
 */
export const testEndpoint = (_req: Request, res: Response) => {
  console.log('✅ Test endpoint called - SENDING RESPONSE');
  
  res.json({ 
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    server: {
      name: 'ClinicQueue API Server',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    features: {
      authentication: true,
      patient_management: true,
      appointment_scheduling: true,
      queue_management: true,
      visit_tracking: true,
      staff_management: true
    }
  });
};

/**
 * Echo test controller - echoes back request data
 */
export const echoTest = (req: Request, res: Response) => {
  const { body, query, headers, method, url } = req;
  
  res.json({
    message: 'Echo test successful',
    timestamp: new Date().toISOString(),
    request: {
      method,
      url,
      headers: {
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
      },
      query,
      body
    },
    server: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
};