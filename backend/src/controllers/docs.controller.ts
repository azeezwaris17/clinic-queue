// backend/src/controllers/docs.controller.ts
/**
 * API Documentation Controller
 */

import {  Response } from 'express';
import { asyncHandler } from '../middleware';

/**
 * @swagger
 * /api/docs/info:
 *   get:
 *     summary: Get API information and endpoints
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: ClinicQueue API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 description:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: /api/auth
 *                     patients:
 *                       type: string
 *                       example: /api/patients
 *                     visits:
 *                       type: string
 *                       example: /api/visits
 *                     queue:
 *                       type: string
 *                       example: /api/queue
 *                     appointments:
 *                       type: string
 *                       example: /api/appointments
 *                     staff:
 *                       type: string
 *                       example: /api/staff
 */
export const getApiInfo = asyncHandler(async ( res: Response) => {
  res.json({
    name: 'ClinicQueue API',
    version: '1.0.0',
    description: 'Healthcare Patient Management System API',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      visits: '/api/visits',
      queue: '/api/queue',
      appointments: '/api/appointments',
      staff: '/api/staff',
      docs: '/api/docs',
      health: '/api/health'
    },
    documentation: {
      interactive: '/api/docs',
      spec: '/api/docs.json',
      info: '/api/docs/info'
    }
  });
});