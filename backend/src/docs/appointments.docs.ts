/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment management and scheduling endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "app_123456"
 *         patientId:
 *           type: string
 *           example: "pat_123456"
 *         doctorId:
 *           type: string
 *           example: "doc_123456"
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         duration:
 *           type: integer
 *           minimum: 5
 *           maximum: 240
 *           example: 30
 *         status:
 *           type: string
 *           enum: [scheduled, confirmed, in-progress, completed, cancelled]
 *           example: "scheduled"
 *         reasonForVisit:
 *           type: string
 *           example: "Annual checkup"
 *         appointmentType:
 *           type: string
 *           enum: [checkup, follow-up, consultation, procedure, emergency]
 *           example: "checkup"
 *         chiefComplaint:
 *           type: string
 *           example: "Routine physical examination"
 *         notes:
 *           type: string
 *           example: "Patient requested morning appointment"
 *         preAppointmentInstructions:
 *           type: string
 *           example: "Fast for 12 hours before appointment"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time

 *     CreateAppointmentRequest:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - scheduledTime
 *         - reasonForVisit
 *         - appointmentType
 *       properties:
 *         patientId:
 *           type: string
 *           example: "64abc123def456789012345"
 *         doctorId:
 *           type: string
 *           example: "64abc123def456789012346"
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           example: "2024-02-15T10:00:00Z"
 *         duration:
 *           type: integer
 *           minimum: 5
 *           maximum: 240
 *           default: 30
 *           example: 45
 *         reasonForVisit:
 *           type: string
 *           maxLength: 500
 *           example: "Annual physical examination and blood work"
 *         appointmentType:
 *           type: string
 *           enum: [checkup, follow-up, consultation, procedure, emergency]
 *           example: "checkup"
 *         chiefComplaint:
 *           type: string
 *           maxLength: 1000
 *           example: "Routine health maintenance"
 *         notes:
 *           type: string
 *           maxLength: 2000
 *           example: "Patient requests full blood panel"
 *         preAppointmentInstructions:
 *           type: string
 *           maxLength: 1000
 *           example: "Fast for 12 hours before appointment"

 *     AvailabilityCheckRequest:
 *       type: object
 *       required:
 *         - doctorId
 *         - startTime
 *       properties:
 *         doctorId:
 *           type: string
 *           example: "64abc123def456789012346"
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: "2024-02-01T14:00:00Z"
 *         duration:
 *           type: integer
 *           minimum: 5
 *           maximum: 240
 *           default: 30
 *           example: 30
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get paginated list of appointments with filtering
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter appointments from this date
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter appointments until this date
 *         example: "2024-01-31T23:59:59Z"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by appointment status
 *         example: "scheduled"
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter by doctor ID
 *         example: "64abc123def456789012346"
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
 *         description: List of appointments retrieved successfully
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
 *                     $ref: '#/components/schemas/Appointment'
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     summary: Create new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAppointmentRequest'
 *           examples:
 *             annualCheckup:
 *               summary: Annual physical examination
 *               value:
 *                 patientId: "64abc123def456789012345"
 *                 doctorId: "64abc123def456789012346"
 *                 scheduledTime: "2024-02-15T10:00:00Z"
 *                 duration: 45
 *                 reasonForVisit: "Annual physical examination and blood work"
 *                 appointmentType: "checkup"
 *                 chiefComplaint: "Routine health maintenance"
 *                 notes: "Patient requests full blood panel"
 *             followUp:
 *               summary: Follow-up consultation
 *               value:
 *                 patientId: "64abc123def456789012347"
 *                 doctorId: "64abc123def456789012348"
 *                 scheduledTime: "2024-02-20T14:30:00Z"
 *                 duration: 30
 *                 reasonForVisit: "Follow-up on blood test results"
 *                 appointmentType: "follow-up"
 *                 chiefComplaint: "Review lab results"
 *                 preAppointmentInstructions: "Bring previous test results"
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "app_123456"
 *                     patientId: "64abc123def456789012345"
 *                     doctorId: "64abc123def456789012346"
 *                     scheduledTime: "2024-02-15T10:00:00Z"
 *                     duration: 45
 *                     status: "scheduled"
 *                     reasonForVisit: "Annual physical examination and blood work"
 *                     appointmentType: "checkup"
 *                     chiefComplaint: "Routine health maintenance"
 *                     notes: "Patient requests full blood panel"
 *                     createdAt: "2024-01-15T08:30:00Z"
 *                     updatedAt: "2024-01-15T08:30:00Z"
 *       400:
 *         description: Validation error or scheduling conflict
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Scheduling conflict detected
 */

/**
 * @swagger
 * /api/appointments/availability:
 *   get:
 *     summary: Check doctor availability for scheduling
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         example: "64abc123def456789012346"
 *       - in: query
 *         name: startTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         example: "2024-02-01T14:00:00Z"
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 30
 *         example: 30
 *     responses:
 *       200:
 *         description: Availability check completed
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
 *                     available:
 *                       type: boolean
 *                       example: true
 *                     conflictingAppointments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Appointment'
 *             examples:
 *               available:
 *                 value:
 *                   success: true
 *                   data:
 *                     available: true
 *                     conflictingAppointments: []
 *               notAvailable:
 *                 value:
 *                   success: true
 *                   data:
 *                     available: false
 *                     conflictingAppointments:
 *                       - id: "app_123457"
 *                         patientId: "64abc123def456789012349"
 *                         doctorId: "64abc123def456789012346"
 *                         scheduledTime: "2024-02-01T14:00:00Z"
 *                         duration: 30
 *                         status: "scheduled"
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/appointments/doctor/{doctorId}:
 *   get:
 *     summary: Get appointments for specific doctor
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         example: "64abc123def456789012346"
 *     responses:
 *       200:
 *         description: Doctor appointments retrieved successfully
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
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "app_123456"
 *     responses:
 *       200:
 *         description: Appointment details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 *
 *   patch:
 *     summary: Update appointment details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "app_123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: integer
 *                 example: 60
 *               notes:
 *                 type: string
 *                 example: "Extended appointment for comprehensive evaluation"
 *           examples:
 *             updateDuration:
 *               value:
 *                 duration: 60
 *                 notes: "Extended appointment for comprehensive evaluation"
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 *       409:
 *         description: Scheduling conflict
 *
 *   delete:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "app_123456"
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
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
 *                   example: "Appointment cancelled successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */

export const appointmentsDocs = {};
