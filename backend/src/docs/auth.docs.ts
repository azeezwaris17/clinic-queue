// backend/src/routes/auth.ts (Swagger docs section)
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: emily.carter@clinic.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123

 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - role
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john.doctor@clinic.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: password123
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doctor
 *         role:
 *           type: string
 *           enum: [doctor, nurse, receptionist, admin]
 *           example: doctor
 *         phone:
 *           type: string
 *           example: 5551234567
 *         specialty:
 *           type: string
 *           example: Cardiology

 *     RegisterAdminRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: new.admin@clinic.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: admin123
 *         firstName:
 *           type: string
 *           example: New
 *         lastName:
 *           type: string
 *           example: Admin
 *         phone:
 *           type: string
 *           example: 5559999999

 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           example: oldpassword123
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: newpassword123

 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string

 *     SystemStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             totalAdmins:
 *               type: number
 *               example: 1
 *             totalStaff:
 *               type: number
 *               example: 5
 *             hasAdmin:
 *               type: boolean
 *               example: true
 *             systemReady:
 *               type: boolean
 *               example: true

 *     AdminStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             totalStaff:
 *               type: number
 *               example: 10
 *             totalAdmins:
 *               type: number
 *               example: 2
 *             roles:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: doctor
 *                   count:
 *                     type: number
 *                     example: 3
 */

/**
 * @swagger
 * /api/auth/system-status:
 *   get:
 *     summary: Get system initialization status
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemStatusResponse'
 *             examples:
 *               systemReady:
 *                 value:
 *                   success: true
 *                   data:
 *                     totalAdmins: 1
 *                     totalStaff: 5
 *                     hasAdmin: true
 *                     systemReady: true
 *               noAdmin:
 *                 value:
 *                   success: true
 *                   data:
 *                     totalAdmins: 0
 *                     totalStaff: 0
 *                     hasAdmin: false
 *                     systemReady: false
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate staff member and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             doctorLogin:
 *               summary: Doctor login
 *               value:
 *                 email: emily.carter@clinic.com
 *                 password: password123
 *             adminLogin:
 *               summary: Admin login
 *               value:
 *                 email: admin@clinic.com
 *                 password: admin123
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: Login successful
 *                   data:
 *                     token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       id: doc_123456
 *                       email: emily.carter@clinic.com
 *                       role: doctor
 *                       firstName: Emily
 *                       lastName: Carter
 *                       specialty: Cardiology
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             examples:
 *               invalidCredentials:
 *                 value:
 *                   success: false
 *                   message: Invalid email or password
 *       429:
 *         description: Too many login attempts
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new staff member (first user becomes admin)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             newDoctor:
 *               summary: Register new doctor
 *               value:
 *                 email: new.doctor@clinic.com
 *                 password: password123
 *                 firstName: New
 *                 lastName: Doctor
 *                 role: doctor
 *                 phone: "5559999999"
 *                 specialty: Pediatrics
 *             newNurse:
 *               summary: Register new nurse
 *               value:
 *                 email: new.nurse@clinic.com
 *                 password: password123
 *                 firstName: Sarah
 *                 lastName: Nurse
 *                 role: nurse
 *                 phone: "5558888888"
 *             firstAdmin:
 *               summary: First registration becomes admin
 *               value:
 *                 email: first.admin@clinic.com
 *                 password: admin123
 *                 firstName: First
 *                 lastName: Admin
 *                 role: receptionist
 *                 phone: "5557777777"
 *     responses:
 *       201:
 *         description: Staff member registered successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: Staff member registered successfully
 *                   data:
 *                     id: doc_789012
 *                     email: new.doctor@clinic.com
 *                     firstName: New
 *                     lastName: Doctor
 *                     role: doctor
 *                     specialty: Pediatrics
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */

/**
 * @swagger
 * /api/auth/register-admin:
 *   post:
 *     summary: Register a new admin (admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterAdminRequest'
 *           examples:
 *             newAdmin:
 *               summary: Register new admin
 *               value:
 *                 email: new.admin@clinic.com
 *                 password: admin123
 *                 firstName: New
 *                 lastName: Administrator
 *                 phone: "5556666666"
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: Admin registration successful
 *                   data:
 *                     token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       id: admin_123456
 *                       email: new.admin@clinic.com
 *                       role: admin
 *                       firstName: New
 *                       lastName: Administrator
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify JWT token validity
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       type: object
 *             examples:
 *               valid:
 *                 value:
 *                   success: true
 *                   data:
 *                     valid: true
 *                     user:
 *                       id: doc_123456
 *                       email: emily.carter@clinic.com
 *                       role: doctor
 *       401:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout staff member (client-side token invalidation)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: Logout successful
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change staff member's password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           examples:
 *             changePassword:
 *               value:
 *                 currentPassword: oldpassword123
 *                 newPassword: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/auth/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminStatsResponse'
 *             examples:
 *               stats:
 *                 value:
 *                   success: true
 *                   data:
 *                     totalStaff: 10
 *                     totalAdmins: 2
 *                     roles:
 *                       - _id: doctor
 *                         count: 3
 *                       - _id: nurse
 *                         count: 2
 *                       - _id: receptionist
 *                         count: 3
 *                       - _id: admin
 *                         count: 2
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

export const authDocs = {};