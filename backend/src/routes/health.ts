/**
 * Health Check Routes
 * 
 * System health monitoring and status endpoints
 */

import express, { Router } from 'express';
import { healthCheck, simpleHealthCheck } from '../controllers/health.controller';
import { testEndpoint, echoTest } from '../controllers/test.controller';

const router: Router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Comprehensive health check including database status and system metrics
 * @access  Public
 */
router.get('/health', healthCheck);

/**
 * @route   GET /api/health/simple
 * @desc    Lightweight health check for load balancers and basic monitoring
 * @access  Public
 */
router.get('/health/simple', simpleHealthCheck);

/**
 * @route   GET /api/test
 * @desc    Basic test endpoint to verify API functionality
 * @access  Public
 */
router.get('/test', testEndpoint);

/**
 * @route   POST /api/test/echo
 * @desc    Echo endpoint that returns request data (useful for testing)
 * @access  Public
 */
router.post('/test/echo', echoTest);

export default router;