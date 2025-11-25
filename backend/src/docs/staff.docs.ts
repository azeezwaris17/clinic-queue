/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management and profile operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "doc_123456"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doctor@clinic.com"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doctor"
 *         role:
 *           type: string
 *           enum: [doctor, nurse, receptionist, admin]
 *           example: "doctor"
 *         phone:
 *           type: string
 *           example: "5551234567"
 *         specialty:
 *           type: string
 *           example: "Cardiology"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time

 *     UpdateStaffRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "John"
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "Smith"
 *         phone:
 *           type: string
 *           example: "5559876543"
 *         specialty:
 *           type: string
 *           maxLength: 100
 *           example: "Advanced Cardiology"
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff members (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
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
 *                     $ref: '#/components/schemas/Staff'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "doc_123456"
 *                       email: "emily.carter@clinic.com"
 *                       firstName: "Emily"
 *                       lastName: "Carter"
 *                       role: "doctor"
 *                       phone: "5551234567"
 *                       specialty: "Cardiology"
 *                       isActive: true
 *                       createdAt: "2024-01-15T08:30:00Z"
 *                       updatedAt: "2024-01-15T08:30:00Z"
 *                     - id: "nur_123456"
 *                       email: "sarah.jones@clinic.com"
 *                       firstName: "Sarah"
 *                       lastName: "Jones"
 *                       role: "nurse"
 *                       phone: "5559876543"
 *                       isActive: true
 *                       createdAt: "2024-01-15T08:30:00Z"
 *                       updatedAt: "2024-01-15T08:30:00Z"
 *                     - id: "adm_123456"
 *                       email: "admin@clinic.com"
 *                       firstName: "Admin"
 *                       lastName: "User"
 *                       role: "admin"
 *                       phone: "5551112222"
 *                       isActive: true
 *                       createdAt: "2024-01-15T08:30:00Z"
 *                       updatedAt: "2024-01-15T08:30:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /api/staff/doctors:
 *   get:
 *     summary: Get all doctors for appointment scheduling
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctors list retrieved
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
 *                     $ref: '#/components/schemas/Staff'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "doc_123456"
 *                       email: "emily.carter@clinic.com"
 *                       firstName: "Emily"
 *                       lastName: "Carter"
 *                       role: "doctor"
 *                       phone: "5551234567"
 *                       specialty: "Cardiology"
 *                       isActive: true
 *                     - id: "doc_789012"
 *                       email: "michael.wong@clinic.com"
 *                       firstName: "Michael"
 *                       lastName: "Wong"
 *                       role: "doctor"
 *                       phone: "5558889999"
 *                       specialty: "Pediatrics"
 *                       isActive: true
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/staff/me:
 *   get:
 *     summary: Get current staff member profile
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current staff profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "doc_123456"
 *                     email: "emily.carter@clinic.com"
 *                     firstName: "Emily"
 *                     lastName: "Carter"
 *                     role: "doctor"
 *                     phone: "5551234567"
 *                     specialty: "Cardiology"
 *                     isActive: true
 *                     createdAt: "2024-01-15T08:30:00Z"
 *                     updatedAt: "2024-01-15T08:30:00Z"
 *       401:
 *         description: Unauthorized
 *
 *   patch:
 *     summary: Update current staff profile
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffRequest'
 *           examples:
 *             updateProfile:
 *               value:
 *                 phone: "5551234567"
 *                 specialty: "Advanced Cardiology"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Profile updated successfully"
 *                   data:
 *                     id: "doc_123456"
 *                     phone: "5551234567"
 *                     specialty: "Advanced Cardiology"
 *                     updatedAt: "2024-01-15T09:30:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff member by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "doc_123456"
 *     responses:
 *       200:
 *         description: Staff member details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "doc_123456"
 *                     email: "emily.carter@clinic.com"
 *                     firstName: "Emily"
 *                     lastName: "Carter"
 *                     role: "doctor"
 *                     phone: "5551234567"
 *                     specialty: "Cardiology"
 *                     isActive: true
 *                     createdAt: "2024-01-15T08:30:00Z"
 *                     updatedAt: "2024-01-15T08:30:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Staff member not found
 *
 *   patch:
 *     summary: Update staff member (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "doc_123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaffRequest'
 *           examples:
 *             updateStaff:
 *               value:
 *                 phone: "5559876543"
 *                 specialty: "Pediatrics"
 *                 isActive: true
 *     responses:
 *       200:
 *         description: Staff member updated
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Staff member updated successfully"
 *                   data:
 *                     id: "doc_123456"
 *                     phone: "5559876543"
 *                     specialty: "Pediatrics"
 *                     updatedAt: "2024-01-15T09:30:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Staff member not found
 *
 *   delete:
 *     summary: Deactivate staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "doc_123456"
 *     responses:
 *       200:
 *         description: Staff member deactivated
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Staff member deactivated successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Staff member not found
 */

export const staffDocs = {};
