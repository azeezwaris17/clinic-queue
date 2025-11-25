// backend/src/utils/adminSetup.ts
/**
 * Admin Setup Utility
 * 
 * Handles first admin creation and system initialization
 */

import Staff from '../models/Staff';
import { hashPassword } from './password';

/**
 * Checks if any admin exists in the system
 */
export const hasExistingAdmin = async (): Promise<boolean> => {
  const adminCount = await Staff.countDocuments({ role: 'admin', isActive: true });
  return adminCount > 0;
};

/**
 * Creates the first system admin
 * Should be called during system initialization
 */
export const createFirstAdmin = async (): Promise<void> => {
  const adminExists = await hasExistingAdmin();
  
  if (!adminExists) {
    const defaultAdmin = new Staff({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@clinic.com',
      password: await hashPassword('Admin123!'), // Should be changed on first login
      role: 'admin',
      phone: '5550000000',
      isActive: true
    });

    await defaultAdmin.save();
    console.log('✅ First admin created: admin@clinic.com');
  }
};

/**
 * Gets admin statistics
 */
export const getAdminStats = async () => {
  const totalAdmins = await Staff.countDocuments({ role: 'admin', isActive: true });
  const totalStaff = await Staff.countDocuments({ isActive: true });
  
  return {
    totalAdmins,
    totalStaff,
    hasAdmin: totalAdmins > 0
  };
};