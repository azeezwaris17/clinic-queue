/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management and records endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "pat_123456"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           example: "5551234567"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1985-05-15"
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           example: "male"
 *         address:
 *           type: string
 *           example: "123 Main St"
 *         city:
 *           type: string
 *           example: "New York"
 *         state:
 *           type: string
 *           example: "NY"
 *         zipCode:
 *           type: string
 *           example: "10001"
 *         insuranceId:
 *           type: string
 *           example: "INS123456"
 *         allergies:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Penicillin", "Peanuts"]
 *         currentMedications:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Lisinopril 10mg", "Metformin 500mg"]
 *         medicalHistory:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Hypertension", "Type 2 Diabetes"]
 *         emergencyContact:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Jane Doe"
 *             relationship:
 *               type: string
 *               example: "Spouse"
 *             phone:
 *               type: string
 *               example: "5559876543"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time

 *     CreatePatientRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *         - dateOfBirth
 *         - gender
 *         - address
 *         - city
 *         - state
 *         - zipCode
 *         - emergencyContact
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "Michael"
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "Brown"
 *         email:
 *           type: string
 *           format: email
 *           example: "michael.brown@example.com"
 *         phone:
 *           type: string
 *           example: "5551239876"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1982-05-20"
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           example: "male"
 *         address:
 *           type: string
 *           example: "789 Oak Lane"
 *         city:
 *           type: string
 *           example: "Springfield"
 *         state:
 *           type: string
 *           example: "IL"
 *         zipCode:
 *           type: string
 *           example: "62706"
 *         insuranceId:
 *           type: string
 *           example: "INS123456"
 *         allergies:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Sulfa"]
 *         currentMedications:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Metoprolol 50mg daily"]
 *         medicalHistory:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Hypertension"]
 *         emergencyContact:
 *           type: object
 *           required:
 *             - name
 *             - relationship
 *             - phone
 *           properties:
 *             name:
 *               type: string
 *               example: "Susan Brown"
 *             relationship:
 *               type: string
 *               example: "Wife"
 *             phone:
 *               type: string
 *               example: "5559871234"
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get paginated list of patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     pages:
 *                       type: integer
 *                       example: 3
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "pat_123456"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john.doe@example.com"
 *                       phone: "5551234567"
 *                       dateOfBirth: "1985-05-15"
 *                       gender: "male"
 *                       address: "123 Main St"
 *                       city: "New York"
 *                       state: "NY"
 *                       zipCode: "10001"
 *                       insuranceId: "INS123456"
 *                       allergies: ["Penicillin", "Peanuts"]
 *                       currentMedications: ["Lisinopril 10mg", "Metformin 500mg"]
 *                       medicalHistory: ["Hypertension", "Type 2 Diabetes"]
 *                       emergencyContact:
 *                         name: "Jane Doe"
 *                         relationship: "Spouse"
 *                         phone: "5559876543"
 *                       createdAt: "2024-01-15T08:30:00Z"
 *                       updatedAt: "2024-01-15T08:30:00Z"
 *                   pagination:
 *                     page: 1
 *                     limit: 20
 *                     total: 45
 *                     pages: 3
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     summary: Create new patient record
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePatientRequest'
 *           examples:
 *             newPatient:
 *               summary: Create new patient with complete information
 *               value:
 *                 firstName: "Michael"
 *                 lastName: "Brown"
 *                 email: "michael.brown@example.com"
 *                 phone: "5551239876"
 *                 dateOfBirth: "1982-05-20"
 *                 gender: "male"
 *                 address: "789 Oak Lane"
 *                 city: "Springfield"
 *                 state: "IL"
 *                 zipCode: "62706"
 *                 insuranceId: "INS123456"
 *                 allergies: ["Sulfa"]
 *                 currentMedications: ["Metoprolol 50mg daily"]
 *                 medicalHistory: ["Hypertension"]
 *                 emergencyContact:
 *                   name: "Susan Brown"
 *                   relationship: "Wife"
 *                   phone: "5559871234"
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "pat_789012"
 *                     firstName: "Michael"
 *                     lastName: "Brown"
 *                     email: "michael.brown@example.com"
 *                     phone: "5551239876"
 *                     dateOfBirth: "1982-05-20"
 *                     gender: "male"
 *                     address: "789 Oak Lane"
 *                     city: "Springfield"
 *                     state: "IL"
 *                     zipCode: "62706"
 *                     insuranceId: "INS123456"
 *                     allergies: ["Sulfa"]
 *                     currentMedications: ["Metoprolol 50mg daily"]
 *                     medicalHistory: ["Hypertension"]
 *                     emergencyContact:
 *                       name: "Susan Brown"
 *                       relationship: "Wife"
 *                       phone: "5559871234"
 *                     createdAt: "2024-01-15T08:30:00Z"
 *                     updatedAt: "2024-01-15T08:30:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Patient already exists
 */

/**
 * @swagger
 * /api/patients/search:
 *   get:
 *     summary: Search patients by name, email, or phone
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term (name, email, or phone)
 *         example: "john"
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 pagination:
 *                   type: object
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "pat_123456"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john.doe@example.com"
 *                       phone: "5551234567"
 *                       dateOfBirth: "1985-05-15"
 *                       gender: "male"
 *                   - id: "pat_789012"
 *                     firstName: "Johnny"
 *                     lastName: "Smith"
 *                     email: "johnny.smith@example.com"
 *                     phone: "5551112222"
 *                     dateOfBirth: "1990-08-20"
 *                     gender: "male"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total: 2
 *                     pages: 1
 *       400:
 *         description: Invalid search query
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID with full details
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "pat_123456"
 *     responses:
 *       200:
 *         description: Patient details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "pat_123456"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john.doe@example.com"
 *                     phone: "5551234567"
 *                     dateOfBirth: "1985-05-15"
 *                     gender: "male"
 *                     address: "123 Main St"
 *                     city: "New York"
 *                     state: "NY"
 *                     zipCode: "10001"
 *                     insuranceId: "INS123456"
 *                     allergies: ["Penicillin", "Peanuts"]
 *                     currentMedications: ["Lisinopril 10mg", "Metformin 500mg"]
 *                     medicalHistory: ["Hypertension", "Type 2 Diabetes"]
 *                     emergencyContact:
 *                       name: "Jane Doe"
 *                       relationship: "Spouse"
 *                       phone: "5559876543"
 *                     createdAt: "2024-01-15T08:30:00Z"
 *                     updatedAt: "2024-01-15T08:30:00Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *
 *   patch:
 *     summary: Update patient information
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "pat_123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "5558889999"
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Sulfa", "Penicillin"]
 *           examples:
 *             updateContact:
 *               value:
 *                 phone: "5558889999"
 *                 allergies: ["Sulfa", "Penicillin"]
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Patient updated successfully"
 *                   data:
 *                     id: "pat_123456"
 *                     phone: "5558889999"
 *                     allergies: ["Sulfa", "Penicillin"]
 *                     updatedAt: "2024-01-15T09:30:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */

/**
 * @swagger
 * /api/patients/{id}/visits:
 *   get:
 *     summary: Get patient's visit history
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "pat_123456"
 *     responses:
 *       200:
 *         description: Visit history retrieved
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "vis_123456"
 *                       patientId: "pat_123456"
 *                       status: "completed"
 *                       symptoms: "Fever and cough"
 *                       temperature: 101.2
 *                       heartRate: 88
 *                       bloodPressure: "130/85"
 *                       painLevel: 5
 *                       checkInTime: "2024-01-10T08:30:00Z"
 *                       completedAt: "2024-01-10T10:15:00Z"
 *                     - id: "vis_789012"
 *                       patientId: "pat_123456"
 *                       status: "completed"
 *                       symptoms: "Annual checkup"
 *                       temperature: 98.6
 *                       heartRate: 72
 *                       bloodPressure: "120/80"
 *                       painLevel: 0
 *                       checkInTime: "2024-01-05T09:00:00Z"
 *                       completedAt: "2024-01-05T09:45:00Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */

export const patientsDocs = {};
