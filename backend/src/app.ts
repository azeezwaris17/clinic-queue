// backend/src/app.ts 
/**
 * ClinicQueue Backend Server - Complete with All Middleware
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database';

// Import the Swagger setup from our new docs structure
import { swaggerUi, specs } from './docs';

// Security middleware
import { securityHeaders, corsHeaders, additionalSecurityHeaders } from './middleware/security';

// Validation middleware
import { sanitizeInput } from './middleware/validation';

// Logging & Monitoring middleware
import { enhancedLogger, auditLogger, performanceMonitor } from './middleware/logging';

// Performance middleware
import { cacheControl, responseTime } from './middleware/performance';

// Error handling middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import visitRoutes from './routes/visits';
import queueRoutes from './routes/queue';
import appointmentRoutes from './routes/appointments';
import staffRoutes from './routes/staff';

// Admin setup
import { createFirstAdmin, getAdminStats } from './utils/adminSetup';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔄 Starting server initialization...');

// ========================
// DEBUGGING MIDDLEWARE (ADD THIS FIRST)
// ========================

// Add request logging at the very top
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`📨 INCOMING REQUEST: ${req.method} ${req.path}`);
  next();
});

// ========================
// MIDDLEWARE STACK (ORDER MATTERS!)
// ========================

console.log('🔧 Setting up middleware stack...');

// 1. Security & Compression (First line of defense)
console.log('🛡️  Loading security middleware...');
app.use(securityHeaders);
app.use(corsHeaders);
app.use(additionalSecurityHeaders);
console.log('✅ Security middleware loaded');

// 2. Enhanced CORS Configuration for Production
console.log('🌐 Setting up CORS middleware...');

// CORS callback function with proper typing
const corsOriginCallback = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps, curl, etc.)
  if (!origin) return callback(null, true);
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  // Allow current Render domain and common patterns
  const isAllowedOrigin = 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') ||
    origin.includes('onrender.com') || // Allow all Render subdomains
    allowedOrigins.includes('*') || 
    allowedOrigins.includes(origin);
  
  if (isAllowedOrigin) {
    callback(null, true);
  } else {
    console.log('🚫 CORS blocked origin:', origin);
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  }
};

const corsOptions: cors.CorsOptions = {
  origin: corsOriginCallback,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
console.log('✅ CORS middleware loaded');

// 3. Logging & Monitoring (Log everything that comes in)
console.log('📊 Loading logging middleware...');
app.use(enhancedLogger);
app.use(auditLogger);
app.use(performanceMonitor);
app.use(responseTime);
console.log('✅ Logging middleware loaded');

// 4. Body Parsing & Input Sanitization
console.log('📝 Loading body parsing middleware...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
console.log('✅ Body parsing middleware loaded');

// 5. Cache Control
console.log('💾 Loading cache control...');
app.use(cacheControl);
console.log('✅ Cache control loaded');

// Initialize database connection and admin setup
console.log('🗄️  Connecting to database...');
connectDB().then(async () => {
  console.log('👑 Checking admin setup...');
  try {
    await createFirstAdmin();
    const stats = await getAdminStats();
    console.log(`✅ Admin setup complete - ${stats.totalAdmins} admin(s), ${stats.totalStaff} total staff`);
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
  }
}).catch(console.error);

// ========================
// WELCOME & DOCUMENTATION ROUTES
// ========================

/**
 * Welcome page - Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    message: '🏥 ClinicQueue Management System API',
    description: 'A comprehensive backend service for managing clinic operations, patient queues, and medical appointments',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: {
      message: 'For complete API documentation and interactive testing, visit:',
      swagger: `${baseUrl}/api-docs`
    },
    system: {
      status: 'operational',
      health: `${baseUrl}/api/health`
    },
    notice: 'This API provides secure endpoints for clinic management. All endpoints require proper authentication and authorization.',
  });
});

/**
 * Redirect from /docs to /api-docs
 */
app.get('/docs', (_req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// ========================
// SWAGGER DOCUMENTATION - PRODUCTION READY
// ========================
console.log('📚 Setting up Swagger documentation...');

// Serve Swagger JSON
app.get('/api-docs/json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Dynamic Swagger setup for production
app.use('/api-docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const swaggerSpec = {
    ...specs,
    servers: [
      {
        url: baseUrl,
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ]
  };

  return swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'ClinicQueue API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .information-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
      .swagger-ui .btn { background: #007bff; border-color: #007bff; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      tryItOutEnabled: true,
      displayOperationId: true,
    },
  })(req, res, next);
});

console.log('✅ Swagger documentation enabled at /api-docs');

// ========================
// API ROUTES
// ========================

console.log('🛣️  Setting up routes...');

// System routes (health, test, etc.)
app.use('/api', healthRoutes);

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/visits', visitRoutes);

// Protected Routes  
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/staff', staffRoutes);

console.log('✅ All routes configured');

// ========================
// ERROR HANDLING
// ========================

console.log('🚨 Setting up error handlers...');

// 404 Handler (After all routes)
app.use('*', notFoundHandler);

// Global Error Handler (Must be last)
app.use(errorHandler);

console.log('✅ Error handlers configured');

// ========================
// SERVER STARTUP
// ========================

// Start server
app.listen(PORT, () => {
  const environment = process.env.NODE_ENV || 'development';
  const baseUrl = `http://localhost:${PORT}`;
  
  console.log(`\n🎉 SERVER STARTED SUCCESSFULLY!`);
  console.log(`🚀 ClinicQueue Backend Server running on port ${PORT} in ${environment} mode`);

  console.log(`\n🔐 SECURITY & FEATURES:`);
  console.log(`   • Enhanced middleware stack enabled`);
  console.log(`   • Comprehensive logging active`);
  console.log(`   • Admin auto-creation on startup`);
  console.log(`   • Role-based access control`);

  console.log(`\n📚 DOCUMENTATION & TESTING:`);
  console.log(`   🔗 Local:      ${baseUrl}/api-docs`);
  console.log(`   📖 API Spec:   ${baseUrl}/api-docs/json`);

  console.log(`\n🏥 API ENDPOINTS (Local):`);
  console.log(`   🏠 Welcome:    ${baseUrl}/`);
  console.log(`   ❤️  Health:     ${baseUrl}/api/health`);
  console.log(`   🔐 Auth:       ${baseUrl}/api/auth`);

  console.log(`\n🔧 QUICK START:`);
  console.log(`   1. Visit the /api-docs endpoint for interactive API testing`);
  console.log(`   2. Use "Try It Out" feature in Swagger UI`);
  console.log(`   3. Test health endpoint: /api/health`);
  console.log(`   4. Login with admin credentials to access protected routes`);
  
  if (environment === 'development') {
    console.log(`\n🔐 DEVELOPMENT CREDENTIALS:`);
    console.log(`   📧 Email:    admin@clinic.com`);
    console.log(`   🔑 Password: Admin123!`);
    console.log(`   ⚠️  Change this password immediately in production!`);
  }

  console.log(`\n📝 NOTES:`);
  console.log(`   • Swagger UI serves as your temporary frontend`);
  console.log(`   • All API endpoints can be tested via Swagger`);
  console.log(`   • CORS is configured to allow Swagger UI requests`);
  console.log(`   • First user registration becomes admin if no admin exists`);
});

export default app;