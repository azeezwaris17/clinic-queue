import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import all documentation files
import '../docs/health.docs';
import '../docs/auth.docs';
import '../docs/appointments.docs';
import '../docs/patients.docs';
import '../docs/queue.docs';
import '../docs/staff.docs';
import '../docs/visits.docs';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ClinicQueue API',
      version: '1.0.0',
      description: 'Comprehensive Healthcare Patient Management System API for clinic operations, appointments, patients, and staff management',
      contact: {
        name: 'API Support',
        email: 'support@clinic.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/',
        description: 'Development server'
      },
      {
        url: 'https://api.clinic.com/api',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'System',
        description: 'System health and information endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Patients',
        description: 'Patient management and records endpoints'
      },
      {
        name: 'Visits',
        description: 'Patient visit management and operations'
      },
      {
        name: 'Queue',
        description: 'Real-time queue management and operations'
      },
      {
        name: 'Appointments',
        description: 'Appointment management and scheduling endpoints'
      },
      {
        name: 'Staff',
        description: 'Staff management and profile operations'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error description'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts', // Include route files for inline docs
    './src/docs/*.docs.ts', // Include separate documentation files
    './src/app.ts' // Include app.ts for health and system endpoints
  ],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
