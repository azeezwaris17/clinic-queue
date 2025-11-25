/**
 * @swagger
 * tags:
 *   name: Visits
 *   description: Patient visit management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Visit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "vis_123456"
 *         patientId:
 *           type: string
 *           example: "pat_123456"
 *         patient:
 *           $ref: '#/components/schemas/Patient'
 *         status:
 *           type: string
 *           enum: [checked-in, triaged, in-progress, completed, cancelled]
 *           example: "checked-in"
 *         symptoms:
 *           type: string
 *           example: "Fever, cough, and sore throat for 3 days"
 *         temperature:
 *           type: number
 *           example: 98.6
 *         heartRate:
 *           type: integer
 *           example: 72
 *         bloodPressure:
 *           type: string
 *           example: "120/80"
 *         painLevel:
 *           type: integer
 *           minimum: 0
 *           maximum: 10
 *           example: 3
 *         triageScore:
 *           type: integer
 *           example: 2
 *         allergies:
 *           type: string
 *           example: "Penicillin"
 *         medications:
 *           type: string
 *           example: "Lisinopril 10mg daily"
 *         notes:
 *           type: string
 *           example: "Patient appears stable, vitals normal"
 *         checkInTime:
 *           type: string
 *           format: date-time
 *         triageTime:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time

 *     CheckInRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - phone
 *         - dateOfBirth
 *         - gender
 *         - symptoms
 *         - temperature
 *         - heartRate
 *         - bloodPressureSystolic
 *         - bloodPressureDiastolic
 *         - painLevel
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "David"
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "Wilson"
 *         email:
 *           type: string
 *           format: email
 *           example: "david.wilson@example.com"
 *         phone:
 *           type: string
 *           example: "5554443333"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1995-08-15"
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           example: "male"
 *         symptoms:
 *           type: string
 *           minLength: 5
 *           example: "Severe headache, nausea, and sensitivity to light for 3 hours"
 *         temperature:
 *           type: number
 *           minimum: 90
 *           maximum: 110
 *           example: 100.5
 *         heartRate:
 *           type: integer
 *           minimum: 30
 *           maximum: 200
 *           example: 95
 *         bloodPressureSystolic:
 *           type: integer
 *           minimum: 70
 *           maximum: 250
 *           example: 145
 *         bloodPressureDiastolic:
 *           type: integer
 *           minimum: 40
 *           maximum: 150
 *           example: 90
 *         painLevel:
 *           type: integer
 *           minimum: 0
 *           maximum: 10
 *           example: 7
 *         allergies:
 *           type: string
 *           example: "None"
 *         medications:
 *           type: string
 *           example: "Ibuprofen as needed"

 *     UpdateVisitRequest:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           example: "Patient diagnosed with migraine. Prescribed rest and hydration. Follow up if symptoms persist."
 *         completedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T11:30:00Z"

 *     VisitStatistics:
 *       type: object
 *       properties:
 *         totalVisitsToday:
 *           type: integer
 *           example: 45
 *         averageWaitTime:
 *           type: integer
 *           example: 25
 *         completedVisits:
 *           type: integer
 *           example: 38
 *         pendingVisits:
 *           type: integer
 *           example: 7
 *         averageTriageTime:
 *           type: integer
 *           example: 8
 */

/**
 * @swagger
 * /api/visits/check-in:
 *   post:
 *     summary: Process patient check-in with triage scoring
 *     tags: [Visits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckInRequest'
 *           examples:
 *             headache:
 *               summary: Patient with headache symptoms
 *               value:
 *                 firstName: "David"
 *                 lastName: "Wilson"
 *                 email: "david.wilson@example.com"
 *                 phone: "5554443333"
 *                 dateOfBirth: "1995-08-15"
 *                 gender: "male"
 *                 symptoms: "Severe headache, nausea, and sensitivity to light for 3 hours"
 *                 temperature: 100.5
 *                 heartRate: 95
 *                 bloodPressureSystolic: 145
 *                 bloodPressureDiastolic: 90
 *                 painLevel: 7
 *                 allergies: "None"
 *                 medications: "Ibuprofen as needed"
 *             emergency:
 *               summary: High priority emergency case
 *               value:
 *                 firstName: "Emergency"
 *                 lastName: "Patient"
 *                 email: "emergency@example.com"
 *                 phone: "5559119111"
 *                 dateOfBirth: "1970-01-01"
 *                 gender: "male"
 *                 symptoms: "Severe chest pain radiating to left arm, sweating, shortness of breath"
 *                 temperature: 99.8
 *                 heartRate: 135
 *                 bloodPressureSystolic: 180
 *                 bloodPressureDiastolic: 110
 *                 painLevel: 10
 *     responses:
 *       201:
 *         description: Patient checked in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visit'
 *                 queuePosition:
 *                   type: integer
 *                   example: 5
 *                 estimatedWaitTime:
 *                   type: integer
 *                   example: 45
 *                 trackingToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   trackingToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   data:
 *                     id: "vis_123456"
 *                     patientId: "pat_789012"
 *                     status: "checked-in"
 *                     symptoms: "Severe headache, nausea, and sensitivity to light for 3 hours"
 *                     temperature: 100.5
 *                     heartRate: 95
 *                     bloodPressure: "145/90"
 *                     painLevel: 7
 *                     triageScore: 65
 *                     allergies: "None"
 *                     medications: "Ibuprofen as needed"
 *                     checkInTime: "2024-01-15T08:30:00Z"
 *                     triageTime: "2024-01-15T08:35:00Z"
 *                   queuePosition: 3
 *                   estimatedWaitTime: 25
 *       400:
 *         description: Validation error
 *       409:
 *         description: Patient already checked in today
 */

/**
 * @swagger
 * /api/visits/{id}:
 *   get:
 *     summary: Get visit details by ID
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "vis_123456"
 *     responses:
 *       200:
 *         description: Visit details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visit'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "vis_123456"
 *                     patientId: "pat_789012"
 *                     patient:
 *                       id: "pat_789012"
 *                       firstName: "David"
 *                       lastName: "Wilson"
 *                       email: "david.wilson@example.com"
 *                       phone: "5554443333"
 *                     status: "completed"
 *                     symptoms: "Severe headache, nausea, and sensitivity to light for 3 hours"
 *                     temperature: 100.5
 *                     heartRate: 95
 *                     bloodPressure: "145/90"
 *                     painLevel: 7
 *                     triageScore: 65
 *                     allergies: "None"
 *                     medications: "Ibuprofen as needed"
 *                     notes: "Patient diagnosed with migraine. Prescribed rest and hydration."
 *                     checkInTime: "2024-01-15T08:30:00Z"
 *                     triageTime: "2024-01-15T08:35:00Z"
 *                     completedAt: "2024-01-15T10:15:00Z"
 *       404:
 *         description: Visit not found
 *
 *   patch:
 *     summary: Update visit information (notes, completion status)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "vis_123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVisitRequest'
 *           examples:
 *             updateNotes:
 *               value:
 *                 notes: "Patient diagnosed with migraine. Prescribed rest and hydration. Follow up if symptoms persist."
 *                 completedAt: "2024-01-15T11:30:00Z"
 *     responses:
 *       200:
 *         description: Visit updated successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Visit updated successfully"
 *                   data:
 *                     id: "vis_123456"
 *                     notes: "Patient diagnosed with migraine. Prescribed rest and hydration. Follow up if symptoms persist."
 *                     completedAt: "2024-01-15T11:30:00Z"
 *                     updatedAt: "2024-01-15T11:30:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Visit not found
 */

/**
 * @swagger
 * /api/visits/patient/{patientId}:
 *   get:
 *     summary: Get visit history for a patient
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         example: "pat_123456"
 *     responses:
 *       200:
 *         description: Patient visit history retrieved
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
 *                     $ref: '#/components/schemas/Visit'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "vis_123456"
 *                       patientId: "pat_123456"
 *                       status: "completed"
 *                       symptoms: "Fever and cough for 2 days"
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

/**
 * @swagger
 * /api/visits/stats/overview:
 *   get:
 *     summary: Get visit statistics for dashboard
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visit statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VisitStatistics'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     totalVisitsToday: 45
 *                     averageWaitTime: 25
 *                     completedVisits: 38
 *                     pendingVisits: 7
 *                     averageTriageTime: 8
 *                     byStatus:
 *                       - status: "waiting"
 *                         count: 5
 *                         avgWaitTime: 25.5
 *                       - status: "in-progress"
 *                         count: 2
 *                         avgWaitTime: 15.2
 *                       - status: "completed"
 *                         count: 38
 *                         avgWaitTime: 20.1
 *       401:
 *         description: Unauthorized
 */

export const visitsDocs = {};
