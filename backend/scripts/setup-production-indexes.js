require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');

async function setupProductionIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to production database for index setup...');
    
    // Define your indexes here
    const db = mongoose.connection.db;
    
    // Example: Create index for staff collection
    await db.collection('staffs').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Staff email index created');
    
    // Example: Create index for visits collection
    await db.collection('visits').createIndex({ patient: 1, checkInTime: -1 });
    console.log('✅ Visits index created');
    
    await mongoose.disconnect();
    console.log('🎉 Production indexes setup completed!');
  } catch (error) {
    console.error('❌ Index setup failed:', error);
    process.exit(1);
  }
}

setupProductionIndexes();