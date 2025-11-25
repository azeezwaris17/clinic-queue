// backend/src/controllers/staff.controller.ts
/**
 * Staff Controller
 * 
 * Handles staff management operations including profile updates,
 * staff directory, and role-based access management.
 */

import { Request, Response } from 'express';
import { StaffService, StaffRegistrationData, StaffProfileUpdate } from '../services/staff.service';
import { asyncHandler } from '../middleware';

/**
 * Get all staff members (Admin only)
 * @route GET /api/staff
 * @access Private (Admin only)
 */
export const getStaff = asyncHandler(async (req: Request, res: Response) => {
  const {
    role,
    department,
    isActive = 'true',
    query,
    page = '1',
    limit = '20'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const criteria = {
    role: role as string,
    department: department as string,
    isActive: isActive === 'true',
    query: query as string,
    page: pageNum,
    limit: limitNum
  };

  const result = await StaffService.getStaff(criteria);

  res.status(200).json({
    success: true,
    data: result.staff,
    pagination: {
      page: result.page,
      limit: result.pages,
      total: result.total,
      pages: result.pages
    }
  });
});

/**
 * Get all doctors for appointment scheduling
 * @route GET /api/staff/doctors
 * @access Private
 */
export const getDoctors = asyncHandler(async ( res: Response) => {
  try {
    const doctors = await StaffService.getDoctors();

    res.status(200).json({
      success: true,
      data: doctors,
      count: doctors.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve doctors'
    });
  }
});

/**
 * Get current staff member profile
 * @route GET /api/staff/me
 * @access Private
 */
export const getCurrentStaff = asyncHandler(async (req: Request, res: Response) => {
  const staffId = (req as any).user?.id;

  if (!staffId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  try {
    const staff = await StaffService.getStaffById(staffId);

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get staff member by ID
 * @route GET /api/staff/:id
 * @access Private (Admin only)
 */
export const getStaffById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const staff = await StaffService.getStaffById(id);

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Register new staff member
 * @route POST /api/staff
 * @access Private (Admin only)
 */
export const registerStaff = asyncHandler(async (req: Request, res: Response) => {
  try {
    const staffData: StaffRegistrationData = req.body;
    const staff = await StaffService.registerStaff(staffData);

    res.status(201).json({
      success: true,
      message: 'Staff member registered successfully',
      data: staff
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update staff profile
 * @route PATCH /api/staff/:id
 * @access Private
 */
export const updateStaffProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const isAdmin = user?.role === 'admin';

  // Non-admin users can only update their own profile
  if (!isAdmin && id !== user?.id) {
    res.status(403).json({
      success: false,
      error: 'Access denied: You can only update your own profile'
    });
    return;
  }

  const updateData: StaffProfileUpdate = req.body;

  try {
    const staff = await StaffService.updateStaffProfile(id, updateData, isAdmin);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: staff
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update staff role (Admin only)
 * @route PATCH /api/staff/:id/role
 * @access Private (Admin only)
 */
export const updateStaffRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, isActive } = req.body;

  if (!role) {
    res.status(400).json({
      success: false,
      error: 'Role is required'
    });
    return;
  }

  try {
    const staff = await StaffService.updateStaffRole(id, role, isActive ?? true);

    res.status(200).json({
      success: true,
      message: 'Staff role updated successfully',
      data: staff
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Change staff password
 * @route PATCH /api/staff/:id/password
 * @access Private
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user;

  // Users can only change their own password unless they're admin
  if (user?.role !== 'admin' && id !== user?.id) {
    res.status(403).json({
      success: false,
      error: 'Access denied: You can only change your own password'
    });
    return;
  }

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
    return;
  }

  try {
    const result = await StaffService.changePassword(id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Deactivate staff member
 * @route DELETE /api/staff/:id
 * @access Private (Admin only)
 */
export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const staff = await StaffService.deactivateStaff(id);

    res.status(200).json({
      success: true,
      message: 'Staff member deactivated successfully',
      data: staff
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reactivate staff member
 * @route PATCH /api/staff/:id/reactivate
 * @access Private (Admin only)
 */
export const reactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const staff = await StaffService.reactivateStaff(id);

    res.status(200).json({
      success: true,
      message: 'Staff member reactivated successfully',
      data: staff
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get staff statistics
 * @route GET /api/staff/stats
 * @access Private (Admin only)
 */
export const getStaffStatistics = asyncHandler(async ( res: Response) => {
  try {
    const statistics = await StaffService.getStaffStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff statistics'
    });
  }
});

/**
 * Search staff members
 * @route GET /api/staff/search
 * @access Private
 */
export const searchStaff = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || (query as string).trim().length < 2) {
    res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters long'
    });
    return;
  }

  try {
    const staff = await StaffService.searchStaff(query as string);

    res.status(200).json({
      success: true,
      data: staff,
      count: staff.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to search staff'
    });
  }
});