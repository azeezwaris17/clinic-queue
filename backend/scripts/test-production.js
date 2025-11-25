require('dotenv').config({ path: '.env.production' });
const { connectDB, disconnectDB } = require('../dist/config/database');

async function testProductionConnection() {
  try {
    console.log('🔗 Testing production database connection...');
    await connectDB();
    console.log('✅ Production database connection successful!');
    
    // Test a simple query
    const mongoose = require('mongoose');
    const result = await mongoose.connection.db.admin().ping();
    console.log('📊 Database ping result:', result);
    
    await disconnectDB();
    console.log('🎉 All production tests passed!');
  } catch (error) {
    console.error('❌ Production connection test failed:', error);
    process.exit(1);
  }
}

testProductionConnection();