// backend/src/tests/setup.ts
/**
 * Global Test Setup Configuration
 */

import { beforeAll, afterEach, afterAll, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';

// Extend Jest timeout for long DB operations
jest.setTimeout(30000);

beforeAll(async () => {
  console.log('🔧 Setting up test environment...');

  // Set test environment variables if not already set
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic_queue_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
  process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '10';
  process.env.PORT = process.env.PORT || '5001';

  try {
    await connectDB();
    console.log('✅ Test database connected');
  } catch (error: unknown) {
    console.error('❌ Failed to connect to test database:', error instanceof Error ? error.message : String(error));
    // Don't throw error - tests might run without DB
    console.log('⚠️  Continuing tests without database connection');
  }
});

afterEach(async () => {
  // Only clear collections if connected to database
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (error: unknown) {
        console.warn(`⚠️ Could not clear collection ${key}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  // Only disconnect if connected
  if (mongoose.connection.readyState === 1) {
    try {
      await disconnectDB();
      console.log('✅ Test database disconnected');
    } catch (error: unknown) {
      console.error('❌ Error disconnecting from test database:', error instanceof Error ? error.message : String(error));
    }
  }
});