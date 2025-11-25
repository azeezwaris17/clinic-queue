// src/test-atlas-connection.ts
/**
 * MongoDB Atlas Connection Test
 * 
 * Tests connection to MongoDB Atlas cloud database
 * Verifies that the connection string, network access, and authentication
 * are properly configured for the ClinicQueue application.
 */

import { connectDB, disconnectDB, isDatabaseConnected, getDatabaseStats } from '../../config/database';

/**
 * Main function to test MongoDB Atlas connection
 * Tests connection, authentication, and basic database operations
 */
async function testAtlasConnection(): Promise<void> {
  console.log('🌐 Testing MongoDB Atlas Connection...\n');
  console.log('==========================================');

  // Display connection info (masked for security)
  const uri = process.env.MONGODB_URI;
  if (uri) {
    const maskedUri = uri.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://***:***@');
    console.log('📡 Connection Details:');
    console.log(`   URI: ${maskedUri}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  } else {
    console.log('❌ MONGODB_URI environment variable is not set');
    console.log('   Please check your .env file');
    process.exit(1);
  }

  console.log('\n==========================================');

  try {
    // Step 1: Test basic connection
    console.log('\n1. 🔗 Testing database connection...');
    await connectDB();
    console.log('   ✅ Connection established successfully');

    // Step 2: Verify connection status
    console.log('\n2. 📊 Checking connection health...');
    const isConnected = isDatabaseConnected();
    if (isConnected) {
      console.log('   ✅ Connection is active and healthy');
    } else {
      console.log('   ❌ Connection reported as inactive');
      throw new Error('Database connection is not active');
    }

    // Step 3: Get connection statistics
    console.log('\n3. 📈 Gathering connection statistics...');
    const stats = getDatabaseStats();
    console.log('   ✅ Connection statistics:');
    console.log(`      - Database: ${stats.name}`);
    console.log(`      - Host: ${stats.host}`);
    console.log(`      - Port: ${stats.port}`);
    console.log(`      - Status: ${stats.readyStateDescription}`);
    console.log(`      - Models registered: ${stats.models.length}`);

    // Step 4: Test basic database operations
    console.log('\n4. 🧪 Testing database operations...');
    await testDatabaseOperations();
    console.log('   ✅ Basic database operations successful');

    // Step 5: Test collection access
    console.log('\n5. 📁 Testing collection access...');
    await testCollectionAccess();
    console.log('   ✅ Collection access successful');

    console.log('\n==========================================');
    console.log('🎉 MONGODB ATLAS CONNECTION TEST PASSED! ✅');
    console.log('==========================================\n');
    
    console.log('📋 Summary:');
    console.log('   ✅ Connection established');
    console.log('   ✅ Authentication successful');
    console.log('   ✅ Database operations working');
    console.log('   ✅ Collection access verified');
    console.log('   ✅ All systems ready for development\n');

    console.log('🚀 Your ClinicQueue backend is now connected to MongoDB Atlas!');
    console.log('   You can proceed with building your application.');

  } catch (error) {
    console.log('\n==========================================');
    console.log('❌ MONGODB ATLAS CONNECTION TEST FAILED!');
    console.log('==========================================\n');
    
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Check your MONGODB_URI in .env file');
    console.error('   2. Verify your Atlas cluster is running');
    console.error('   3. Ensure your IP address is whitelisted in Atlas');
    console.error('   4. Confirm database user credentials are correct');
    console.error('   5. Check your internet connection');
    
    console.error('\n🔧 Error details:');
    if (error instanceof Error) {
      console.error(`   Error type: ${error.name}`);
      console.error(`   Message: ${error.message}`);
      
      // Provide specific guidance based on error type
      if (error.name === 'MongoServerSelectionError') {
        console.error('\n   🎯 Specific solution:');
        console.error('      - Go to Atlas → Network Access → Add IP Address');
        console.error('      - Add "0.0.0.0/0" for development (temporarily)');
        console.error('      - Or add your specific IP address');
      } else if (error.name === 'MongoNetworkError') {
        console.error('\n   🎯 Specific solution:');
        console.error('      - Check your internet connection');
        console.error('      - Verify firewall settings');
        console.error('      - Try different network');
      } else if (error.message.includes('auth failed')) {
        console.error('\n   🎯 Specific solution:');
        console.error('      - Verify username/password in connection string');
        console.error('      - Check database user permissions in Atlas');
        console.error('      - Ensure password is URL encoded if it has special chars');
      }
    } else {
      console.error('   Unknown error:', error);
    }
    
    process.exit(1);
  } finally {
    // Always disconnect from database
    console.log('\n🔌 Cleaning up...');
    await disconnectDB();
    console.log('✅ Cleanup completed');
  }
}

/**
 * Tests basic database operations to ensure full functionality
 */
async function testDatabaseOperations(): Promise<void> {
  // Import models dynamically to avoid circular dependencies
  const mongoose = await import('mongoose');
  
  // Test that we can perform basic operations
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database instance not available');
  }

  // List collections to verify database access
  const collections = await db.listCollections().toArray();
  console.log(`      - Collections found: ${collections.length}`);
  
  if (collections.length > 0) {
    collections.forEach(collection => {
      console.log(`        • ${collection.name}`);
    });
  } else {
    console.log('        • No collections found (this is normal for new database)');
  }
}

/**
 * Tests access to specific collections used by the application
 */
async function testCollectionAccess(): Promise<void> {
  const mongoose = await import('mongoose');
  
  // Test creating a temporary document in a test collection
  const testCollection = mongoose.connection.db?.collection('connection_test');
  
  if (testCollection) {
    // Create a test document
    const testDoc = {
      test: 'MongoDB Atlas connection test',
      timestamp: new Date(),
      application: 'ClinicQueue Backend'
    };
    
    const result = await testCollection.insertOne(testDoc);
    console.log(`      - Test document inserted with ID: ${result.insertedId}`);
    
    // Read it back to verify
    const foundDoc = await testCollection.findOne({ _id: result.insertedId });
    if (foundDoc) {
      console.log('      - Test document retrieved successfully');
    }
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('      - Test document cleaned up');
  }
}

/**
 * Runs a quick performance test on the connection
 */
async function testConnectionPerformance(): Promise<void> {
  console.log('\n6. ⚡ Testing connection performance...');
  
  const startTime = Date.now();
  
  // Perform a simple query to test response time
  const mongoose = await import('mongoose');
  const db = mongoose.connection.db;
  
  if (db) {
    await db.command({ ping: 1 });
    const responseTime = Date.now() - startTime;
    
    console.log(`   ✅ Ping response time: ${responseTime}ms`);
    
    if (responseTime < 100) {
      console.log('      🚀 Excellent connection speed!');
    } else if (responseTime < 500) {
      console.log('      ✅ Good connection speed');
    } else {
      console.log('      ⚠️  Connection is slower than expected');
    }
  }
}

// Enhanced main function with performance testing
async function runComprehensiveTest(): Promise<void> {
  await testAtlasConnection();
  
  // Reconnect for performance test
  const { connectDB, disconnectDB } = await import('../../config/database');
  await connectDB();
  
  try {
    await testConnectionPerformance();
  } finally {
    await disconnectDB();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runComprehensiveTest().catch(error => {
    console.error('💥 Unhandled error in test:', error);
    process.exit(1);
  });
}

export { testAtlasConnection, runComprehensiveTest };