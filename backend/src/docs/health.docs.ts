/**
 * @swagger
 * tags:
 *   name: System
 *   description: System health monitoring and information endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DatabaseHealth:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy]
 *           example: "healthy"
 *         details:
 *           type: object
 *           properties:
 *             readyState:
 *               type: integer
 *               example: 1
 *             readyStateDescription:
 *               type: string
 *               example: "connected"
 *             host:
 *               type: string
 *               example: "cluster0.mongodb.net"
 *             port:
 *               type: integer
 *               example: 27017
 *             name:
 *               type: string
 *               example: "clinicqueue"
 *             models:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["User", "Patient", "Appointment"]
 *             environment:
 *               type: string
 *               example: "development"
 *             connectionPool:
 *               type: object
 *               properties:
 *                 maxSize:
 *                   type: integer
 *                   example: 10
 *                 currentSize:
 *                   type: string
 *                   example: "unknown"

 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, degraded, unhealthy]
 *           example: "healthy"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         environment:
 *           type: string
 *           example: "development"
 *         version:
 *           type: string
 *           example: "1.0.0"
 *         uptime:
 *           type: number
 *           example: 3600.25
 *         database:
 *           $ref: '#/components/schemas/DatabaseHealth'
 *         memory:
 *           type: object
 *           properties:
 *             usage:
 *               type: object
 *               properties:
 *                 rss:
 *                   type: number
 *                   example: 12582912
 *                 heapTotal:
 *                   type: number
 *                   example: 8388608
 *                 heapUsed:
 *                   type: number
 *                   example: 4653056
 *                 external:
 *                   type: number
 *                   example: 123456
 *             rss:
 *               type: number
 *               example: 12.5
 *             heapTotal:
 *               type: number
 *               example: 8.0
 *             heapUsed:
 *               type: number
 *               example: 4.4
 *             external:
 *               type: number
 *               example: 0.12
 *         pid:
 *           type: integer
 *           example: 12345
 *         platform:
 *           type: string
 *           example: "linux"
 *         nodeVersion:
 *           type: string
 *           example: "v18.17.0"

 *     SimpleHealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy]
 *           example: "healthy"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         database:
 *           type: object
 *           properties:
 *             connected:
 *               type: boolean
 *               example: true
 *             state:
 *               type: string
 *               example: "connected"
 *             host:
 *               type: string
 *               example: "cluster0.mongodb.net"
 *             name:
 *               type: string
 *               example: "clinicqueue"
 *         uptime:
 *           type: number
 *           example: 3600.25

 *     TestResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Test endpoint working!"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         server:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "ClinicQueue API Server"
 *             version:
 *               type: string
 *               example: "1.0.0"
 *             environment:
 *               type: string
 *               example: "development"
 *         features:
 *           type: object
 *           properties:
 *             authentication:
 *               type: boolean
 *               example: true
 *             patient_management:
 *               type: boolean
 *               example: true
 *             appointment_scheduling:
 *               type: boolean
 *               example: true
 *             queue_management:
 *               type: boolean
 *               example: true
 *             visit_tracking:
 *               type: boolean
 *               example: true
 *             staff_management:
 *               type: boolean
 *               example: true

 *     EchoResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Echo test successful"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         request:
 *           type: object
 *           properties:
 *             method:
 *               type: string
 *               example: "POST"
 *             url:
 *               type: string
 *               example: "/api/test/echo"
 *             headers:
 *               type: object
 *               properties:
 *                 user-agent:
 *                   type: string
 *                   example: "Mozilla/5.0..."
 *                 content-type:
 *                   type: string
 *                   example: "application/json"
 *             query:
 *               type: object
 *               example: {}
 *             body:
 *               type: object
 *               example: {"test": "data"}
 *         server:
 *           type: object
 *           properties:
 *             timestamp:
 *               type: string
 *               format: date-time
 *             uptime:
 *               type: number
 *               example: 3600.25

 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "unhealthy"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         error:
 *           type: string
 *           example: "Health check failed"
 *         details:
 *           type: string
 *           example: "Database connection timeout"
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprehensive health check
 *     description: |
 *       Returns detailed health status of the API server including:
 *       - Server status
 *       - Database connectivity with detailed stats
 *       - Memory usage
 *       - System information
 *       - Uptime
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy and running optimally
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             examples:
 *               healthy:
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   environment: "development"
 *                   version: "1.0.0"
 *                   uptime: 3600.25
 *                   database:
 *                     status: "healthy"
 *                     details:
 *                       readyState: 1
 *                       readyStateDescription: "connected"
 *                       host: "cluster0.mongodb.net"
 *                       port: 27017
 *                       name: "clinicqueue"
 *                       models: ["User", "Patient", "Appointment", "Visit", "Staff"]
 *                       environment: "development"
 *                       connectionPool:
 *                         maxSize: 10
 *                         currentSize: "unknown"
 *                   memory:
 *                     usage:
 *                       rss: 12582912
 *                       heapTotal: 8388608
 *                       heapUsed: 4653056
 *                       external: 123456
 *                     rss: 12.5
 *                     heapTotal: 8.0
 *                     heapUsed: 4.4
 *                     external: 0.12
 *                   pid: 12345
 *                   platform: "linux"
 *                   nodeVersion: "v18.17.0"
 *       503:
 *         description: Server is unhealthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               databaseDown:
 *                 value:
 *                   status: "unhealthy"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   error: "Health check failed"
 *                   details: "Database connection failed - unable to connect to MongoDB cluster"
 *               degraded:
 *                 value:
 *                   status: "degraded"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   environment: "production"
 *                   version: "1.0.0"
 *                   uptime: 86400.5
 *                   database:
 *                     status: "unhealthy"
 *                     details:
 *                       error: "Database not connected"
 *                       readyState: 0
 *                       readyStateDescription: "disconnected"
 *                   memory:
 *                     usage:
 *                       rss: 268435456
 *                       heapTotal: 201326592
 *                       heapUsed: 184549376
 *                       external: 16777216
 *                     rss: 256.0
 *                     heapTotal: 192.0
 *                     heapUsed: 176.0
 *                     external: 16.0
 *                   pid: 12345
 *                   platform: "linux"
 *                   nodeVersion: "v18.17.0"
 */

/**
 * @swagger
 * /api/health/simple:
 *   get:
 *     summary: Lightweight health check
 *     description: |
 *       Simple health check endpoint designed for load balancers and
 *       basic monitoring systems. Returns minimal data for quick checks.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleHealthResponse'
 *             examples:
 *               healthy:
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   database:
 *                     connected: true
 *                     state: "connected"
 *                     host: "cluster0.mongodb.net"
 *                     name: "clinicqueue"
 *                   uptime: 3600.25
 *       503:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleHealthResponse'
 *             examples:
 *               unhealthy:
 *                 value:
 *                   status: "unhealthy"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   database:
 *                     connected: false
 *                     state: "disconnected"
 *                     host: "cluster0.mongodb.net"
 *                     name: "clinicqueue"
 *                   uptime: 86400.5
 */

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Basic functionality test
 *     description: |
 *       Simple endpoint to verify API is responding and basic functionality.
 *       Returns server information and enabled features.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is functioning correctly
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestResponse'
 *             examples:
 *               success:
 *                 value:
 *                   message: "Test endpoint working!"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   server:
 *                     name: "ClinicQueue API Server"
 *                     version: "1.0.0"
 *                     environment: "development"
 *                   features:
 *                     authentication: true
 *                     patient_management: true
 *                     appointment_scheduling: true
 *                     queue_management: true
 *                     visit_tracking: true
 *                     staff_management: true
 */

/**
 * @swagger
 * /api/test/echo:
 *   post:
 *     summary: Echo test endpoint
 *     description: |
 *       Echoes back the request data. Useful for testing:
 *       - Request parsing
 *       - Headers
 *       - Body content
 *       - Query parameters
 *     tags: [System]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {"test": "data", "number": 123}
 *           examples:
 *             simpleData:
 *               value:
 *                 test: "data"
 *                 number: 123
 *                 nested:
 *                   field: "value"
 *     parameters:
 *       - in: query
 *         name: testParam
 *         schema:
 *           type: string
 *         description: Test query parameter
 *         example: "hello"
 *     responses:
 *       200:
 *         description: Request data echoed back successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EchoResponse'
 *             examples:
 *               echoExample:
 *                 value:
 *                   message: "Echo test successful"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *                   request:
 *                     method: "POST"
 *                     url: "/api/test/echo?testParam=hello"
 *                     headers:
 *                       user-agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *                       content-type: "application/json"
 *                     query:
 *                       testParam: "hello"
 *                     body:
 *                       test: "data"
 *                       number: 123
 *                   server:
 *                     timestamp: "2024-01-15T10:30:00.000Z"
 *                     uptime: 3600.25
 */

export const healthDocs = {};
