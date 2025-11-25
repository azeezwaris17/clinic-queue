/**
 * @swagger
 * tags:
 *   name: Queue
 *   description: Real-time queue management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     QueueEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "que_123456"
 *         patientId:
 *           type: string
 *           example: "pat_123456"
 *         patient:
 *           $ref: '#/components/schemas/Patient'
 *         status:
 *           type: string
 *           enum: [waiting, in-progress, completed, cancelled]
 *           example: "waiting"
 *         position:
 *           type: integer
 *           example: 3
 *         estimatedWaitTime:
 *           type: integer
 *           example: 45
 *         priority:
 *           type: integer
 *           example: 1
 *         doctorId:
 *           type: string
 *           example: "doc_123456"
 *         assignedRoom:
 *           type: string
 *           example: "Room 101"
 *         checkInTime:
 *           type: string
 *           format: date-time
 *         calledTime:
 *           type: string
 *           format: date-time
 *         completedTime:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *           example: "Patient requires wheelchair access"

 *     QueueStats:
 *       type: object
 *       properties:
 *         totalWaiting:
 *           type: integer
 *           example: 15
 *         totalInProgress:
 *           type: integer
 *           example: 5
 *         averageWaitTime:
 *           type: integer
 *           example: 25
 *         longestWaitTime:
 *           type: integer
 *           example: 67
 *         doctorsActive:
 *           type: integer
 *           example: 8

 *     UpdateQueueStatusRequest:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [waiting, in-progress, completed, cancelled]
 *           example: "in-progress"
 *         doctorId:
 *           type: string
 *           example: "doc_123456"
 *         assignedRoom:
 *           type: string
 *           maxLength: 20
 *           example: "Exam-3"
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           example: "Patient moved to consultation room"

 *     CallNextPatientRequest:
 *       type: object
 *       required:
 *         - doctorId
 *       properties:
 *         doctorId:
 *           type: string
 *           example: "doc_123456"
 *         assignedRoom:
 *           type: string
 *           maxLength: 20
 *           example: "Exam-2"
 */

/**
 * @swagger
 * /api/queue:
 *   get:
 *     summary: Get current queue with patient details
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue retrieved successfully
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
 *                     $ref: '#/components/schemas/QueueEntry'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "que_123456"
 *                       patientId: "pat_123456"
 *                       patient:
 *                         id: "pat_123456"
 *                         firstName: "John"
 *                         lastName: "Doe"
 *                         email: "john.doe@example.com"
 *                         phone: "5551234567"
 *                       status: "waiting"
 *                       position: 1
 *                       estimatedWaitTime: 15
 *                       priority: 1
 *                       doctorId: "doc_123456"
 *                       checkInTime: "2024-01-15T08:30:00Z"
 *                     - id: "que_789012"
 *                       patientId: "pat_789012"
 *                       patient:
 *                         id: "pat_789012"
 *                         firstName: "Jane"
 *                         lastName: "Smith"
 *                         email: "jane.smith@example.com"
 *                         phone: "5559876543"
 *                       status: "in-progress"
 *                       position: 0
 *                       estimatedWaitTime: 0
 *                       priority: 2
 *                       doctorId: "doc_123456"
 *                       assignedRoom: "Exam-1"
 *                       checkInTime: "2024-01-15T08:15:00Z"
 *                       calledTime: "2024-01-15T08:45:00Z"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/queue/current:
 *   get:
 *     summary: Get optimized current queue (for display)
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current queue for display
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
 *                     waiting:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/QueueEntry'
 *                     inProgress:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/QueueEntry'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     waiting:
 *                       - id: "que_123456"
 *                         patientId: "pat_123456"
 *                         patient:
 *                           firstName: "John"
 *                           lastName: "Doe"
 *                         status: "waiting"
 *                         position: 1
 *                         estimatedWaitTime: 15
 *                         priority: 1
 *                         checkInTime: "2024-01-15T08:30:00Z"
 *                     inProgress:
 *                       - id: "que_789012"
 *                         patientId: "pat_789012"
 *                         patient:
 *                           firstName: "Jane"
 *                           lastName: "Smith"
 *                         status: "in-progress"
 *                         doctorId: "doc_123456"
 *                         assignedRoom: "Exam-1"
 *                         checkInTime: "2024-01-15T08:15:00Z"
 *                         calledTime: "2024-01-15T08:45:00Z"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: Get queue statistics for dashboard
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QueueStats'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     totalWaiting: 8
 *                     totalInProgress: 3
 *                     averageWaitTime: 25
 *                     longestWaitTime: 45
 *                     doctorsActive: 5
 *                     visitsToday: 23
 *                     triageStats:
 *                       - _id: "high"
 *                         count: 1
 *                       - _id: "medium"
 *                         count: 4
 *                       - _id: "low"
 *                         count: 3
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/queue/{id}:
 *   patch:
 *     summary: Update queue entry status
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "que_123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQueueStatusRequest'
 *           examples:
 *             updateStatus:
 *               value:
 *                 status: "in-progress"
 *                 doctorId: "doc_123456"
 *                 assignedRoom: "Exam-3"
 *                 notes: "Patient moved to consultation room"
 *     responses:
 *       200:
 *         description: Queue entry updated successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Queue entry updated successfully"
 *                   data:
 *                     id: "que_123456"
 *                     status: "in-progress"
 *                     doctorId: "doc_123456"
 *                     assignedRoom: "Exam-3"
 *                     calledTime: "2024-01-15T09:00:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Queue entry not found
 */

/**
 * @swagger
 * /api/queue/call-next:
 *   post:
 *     summary: Call next patient for consultation
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CallNextPatientRequest'
 *           examples:
 *             callNext:
 *               value:
 *                 doctorId: "doc_123456"
 *                 assignedRoom: "Exam-2"
 *     responses:
 *       200:
 *         description: Next patient called successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QueueEntry'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "que_123456"
 *                     patientId: "pat_123456"
 *                     patient:
 *                       id: "pat_123456"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john.doe@example.com"
 *                       phone: "5551234567"
 *                     status: "in-progress"
 *                     position: 0
 *                     estimatedWaitTime: 0
 *                     priority: 1
 *                     doctorId: "doc_123456"
 *                     assignedRoom: "Exam-2"
 *                     checkInTime: "2024-01-15T08:30:00Z"
 *                     calledTime: "2024-01-15T09:00:00Z"
 *       400:
 *         description: No patients in queue
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/queue/recalculate:
 *   post:
 *     summary: Recalculate queue positions (admin function)
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue positions recalculated
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Queue positions recalculated successfully"
 *                   data:
 *                     recalculated: 15
 *                     averageWaitTime: 22
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

export const queueDocs = {};
