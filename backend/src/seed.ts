// backend/src/seed.ts
/**
 * Database Seeding Script
 * 
 * Populates the database with initial demo data for development and testing.
 * Creates staff members, sample patients, appointments, visits, and queue entries.
 * Provides a complete demo environment for testing all features.
 */

import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/database';
import Staff from './models/Staff';
import Patient from './models/Patient';
import Appointment from './models/Appointment';
import Visit from './models/Visit';
import Queue from './models/Queue';
import { hashPassword } from './utils/password';
import { calculateTriageScore, calculateEstimatedWaitTime } from './utils/triage';
import { createFirstAdmin, hasExistingAdmin } from './utils/adminSetup';

// Load environment variables
dotenv.config();

/**
 * Main seeding function
 */
async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Clear existing data (optional - be careful in production!)
    if (process.env.NODE_ENV !== 'production') {
      await clearExistingData();
    }

    // Seed staff members FIRST (this includes regular staff, admin is created separately)
    const staffMembers = await seedStaff();
    console.log(`✅ Seeded ${staffMembers.length} staff members`);

    // Check if admin exists, create first admin if not
    const adminExists = await hasExistingAdmin();
    if (!adminExists) {
      console.log('👑 No admin found, creating first admin...');
      await createFirstAdmin();
    } else {
      console.log('✅ Admin already exists, skipping admin creation');
    }

    // Seed sample patients
    const patients = await seedPatients();
    console.log(`✅ Seeded ${patients.length} patients`);

    // Seed demo appointments
    const appointments = await seedAppointments(staffMembers, patients);
    console.log(`✅ Seeded ${appointments.length} appointments`);

    // Seed demo visits with queue entries
    const visits = await seedVisitsAndQueue(staffMembers, patients);
    console.log(`✅ Seeded ${visits.length} visits with queue entries`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Display demo credentials and data summary
    displayDemoInfo(staffMembers, patients, appointments, visits);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await disconnectDB();
    console.log('✅ Database connection closed');
  }
}

/**
 * Clears existing data from collections in correct order
 */
async function clearExistingData(): Promise<void> {
  console.log('🧹 Clearing existing data...');
  
  // Define collections to clear (in correct order for foreign key constraints)
  const collections = ['Queue', 'Appointment', 'Visit', 'Patient', 'Staff'];
  
  for (const modelName of collections) {
    try {
      // Dynamically import model
      const model = await import(`./models/${modelName}`);
      await model.default.deleteMany({});
      console.log(`   ✅ Cleared ${modelName} collection`);
    } catch (error: any) {
      console.warn(`   ⚠️ Could not clear ${modelName} collection:`, error.message);
    }
  }
}

/**
 * Seeds staff members with demo accounts (with duplicate handling)
 */
async function seedStaff(): Promise<any[]> {
  const staffData = [
    {
      firstName: 'Emily',
      lastName: 'Carter',
      email: 'emily.carter@clinic.com',
      phone: '5551234567',
      role: 'doctor' as const,
      specialty: 'Cardiology',
      password: await hashPassword('password123'),
      isActive: true,
    },
    {
      firstName: 'Benjamin',
      lastName: 'Lee', 
      email: 'benjamin.lee@clinic.com',
      phone: '5559876543',
      role: 'doctor' as const,
      specialty: 'General Medicine',
      password: await hashPassword('password123'),
      isActive: true,
    },
    {
      firstName: 'Anya',
      lastName: 'Sharma',
      email: 'anya.sharma@clinic.com',
      phone: '5555555555',
      role: 'nurse' as const,
      password: await hashPassword('password123'),
      isActive: true,
    },
    {
      firstName: 'Eleanor',
      lastName: 'Vance',
      email: 'eleanor.vance@clinic.com',
      phone: '5554444444',
      role: 'doctor' as const,
      specialty: 'Cardiology',
      password: await hashPassword('password123'),
      isActive: true,
    },
    {
      firstName: 'Marcus',
      lastName: 'Rodriguez',
      email: 'marcus.rodriguez@clinic.com', 
      phone: '5553333333',
      role: 'receptionist' as const,
      password: await hashPassword('password123'),
      isActive: true,
    }
    // NOTE: Admin is created separately by createFirstAdmin()
  ];

  try {
    console.log(`🔄 Attempting to seed ${staffData.length} staff members...`);
    
    const staffMembers = await Staff.insertMany(staffData, { 
      ordered: false // Continue inserting even if some fail due to duplicates
    });
    
    console.log(`✅ Successfully seeded ${staffMembers.length} staff members`);
    return staffMembers;
    
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error - some staff already exist
      console.log('⚠️  Some staff members already exist, handling duplicates...');
      
      // Get the successfully inserted docs from error result
      if (error.insertedDocs && error.insertedDocs.length > 0) {
        console.log(`✅ ${error.insertedDocs.length} staff members inserted successfully`);
        console.log(`❌ ${staffData.length - error.insertedDocs.length} duplicates skipped`);
        return error.insertedDocs;
      }
      
      // If no inserted docs in error, try to find existing staff
      console.log('🔍 Retrieving existing staff members...');
      const existingStaff = await Staff.find({ 
        email: { $in: staffData.map(s => s.email) } 
      });
      
      console.log(`✅ Found ${existingStaff.length} existing staff members`);
      return existingStaff;
    }
    
    // Re-throw other errors
    console.error('❌ Unexpected error seeding staff:', error);
    throw error;
  }
}

/**
 * Seeds sample patient records
 */
async function seedPatients(): Promise<any[]> {
  const patientData = [
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '5551111111',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'male' as const,
      address: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      allergies: ['Penicillin', 'Shellfish'],
      currentMedications: ['Lisinopril 10mg daily', 'Atorvastatin 20mg daily'],
      medicalHistory: ['Hypertension', 'High Cholesterol'],
      emergencyContact: {
        name: 'Mary Smith',
        relationship: 'Wife',
        phone: '5552222222'
      }
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com', 
      phone: '5553333333',
      dateOfBirth: new Date('1992-07-22'),
      gender: 'female' as const,
      address: '456 Oak Avenue',
      city: 'Springfield',
      state: 'IL', 
      zipCode: '62702',
      allergies: ['Latex'],
      currentMedications: ['Levothyroxine 50mcg daily'],
      medicalHistory: ['Hypothyroidism'],
      emergencyContact: {
        name: 'David Johnson',
        relationship: 'Husband',
        phone: '5554444444'
      }
    },
    {
      firstName: 'Robert',
      lastName: 'Chen',
      email: 'robert.chen@example.com',
      phone: '5555555555',
      dateOfBirth: new Date('1978-11-30'),
      gender: 'male' as const,
      address: '789 Pine Road',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62703',
      allergies: [],
      currentMedications: ['Metformin 500mg twice daily'],
      medicalHistory: ['Type 2 Diabetes'],
      emergencyContact: {
        name: 'Lisa Chen',
        relationship: 'Wife', 
        phone: '5556666666'
      }
    },
    {
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@example.com',
      phone: '5557777777',
      dateOfBirth: new Date('1975-08-14'),
      gender: 'female' as const,
      address: '321 Elm Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      allergies: ['Aspirin', 'Ibuprofen'],
      currentMedications: ['Albuterol inhaler as needed'],
      medicalHistory: ['Asthma', 'Seasonal Allergies'],
      emergencyContact: {
        name: 'Carlos Garcia',
        relationship: 'Husband',
        phone: '5558888888'
      }
    },
    {
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@example.com',
      phone: '5559999999',
      dateOfBirth: new Date('1988-12-03'),
      gender: 'male' as const,
      address: '654 Maple Drive',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62705',
      allergies: ['Peanuts'],
      currentMedications: [],
      medicalHistory: ['Migraines'],
      emergencyContact: {
        name: 'Jennifer Wilson',
        relationship: 'Sister',
        phone: '5550001111'
      }
    }
  ];

  const patients = await Patient.insertMany(patientData);
  return patients;
}

/**
 * Seeds demo appointments between staff and patients
 */
async function seedAppointments(staffMembers: any[], patients: any[]): Promise<any[]> {
  const appointments = [];
  const now = new Date();
  
  const doctors = staffMembers.filter(staff => staff.role === 'doctor');
  
  // Create various types of appointments - ALL FUTURE DATES
  const appointmentTemplates = [
    {
      patientIndex: 0,
      doctorIndex: 0,
      hoursFromNow: 2,
      reason: 'Annual physical examination',
      type: 'checkup' as const,
      status: 'scheduled' as const
    },
    {
      patientIndex: 1,
      doctorIndex: 1,
      hoursFromNow: 24,
      reason: 'Follow-up for medication review',
      type: 'follow-up' as const,
      status: 'confirmed' as const
    },
    {
      patientIndex: 2,
      doctorIndex: 0,
      hoursFromNow: 48,
      reason: 'Diabetes management consultation',
      type: 'consultation' as const,
      status: 'scheduled' as const
    },
    {
      patientIndex: 3,
      doctorIndex: 1,
      hoursFromNow: 72,
      reason: 'Asthma treatment follow-up',
      type: 'follow-up' as const,
      status: 'scheduled' as const
    },
    {
      patientIndex: 4,
      doctorIndex: 0,
      hoursFromNow: 168, // 1 week
      reason: 'Migraine evaluation and treatment plan',
      type: 'consultation' as const,
      status: 'scheduled' as const
    },
    // FUTURE appointment instead of past one
    {
      patientIndex: 0,
      doctorIndex: 1,
      hoursFromNow: 96, // 4 days from now (instead of -24)
      reason: 'Blood pressure check',
      type: 'checkup' as const,
      status: 'scheduled' as const
    }
  ];

  for (const template of appointmentTemplates) {
    const appointmentTime = new Date(now.getTime() + template.hoursFromNow * 60 * 60 * 1000);
    
    console.log(`Creating appointment for ${template.hoursFromNow} hours from now:`, appointmentTime);
    
    const appointment = new Appointment({
      patient: patients[template.patientIndex]._id,
      doctor: doctors[template.doctorIndex]._id,
      scheduledTime: appointmentTime,
      duration: 30,
      reasonForVisit: template.reason,
      appointmentType: template.type,
      status: template.status,
      createdBy: staffMembers.find(s => s.role === 'receptionist')._id
    });
    
    const savedAppointment = await appointment.save();
    appointments.push(savedAppointment);
  }
  
  return appointments;
}

/**
 * Seeds demo visits with queue entries to simulate real clinic activity
 */
async function seedVisitsAndQueue(staffMembers: any[], patients: any[]): Promise<any[]> {
  const visits = [];
  const now = new Date();
  
  const doctors = staffMembers.filter(staff => staff.role === 'doctor');
  
  // Create various visit scenarios to demonstrate triage system
  const visitScenarios = [
    // High priority - Emergency case
    {
      patientIndex: 0,
      symptoms: 'Chest pain and difficulty breathing, started 30 minutes ago',
      temperature: 101.8,
      heartRate: 125,
      bloodPressureSystolic: 165,
      bloodPressureDiastolic: 95,
      painLevel: 8,
      status: 'in-progress' as const,
      room: 'ER-1'
    },
    // Medium priority - Urgent case
    {
      patientIndex: 1,
      symptoms: 'Fever and severe headache for 2 days, vomiting this morning',
      temperature: 102.2,
      heartRate: 98,
      bloodPressureSystolic: 140,
      bloodPressureDiastolic: 88,
      painLevel: 6,
      status: 'waiting' as const
    },
    // Low priority - Routine case
    {
      patientIndex: 2,
      symptoms: 'Seasonal allergies, runny nose and sneezing',
      temperature: 98.6,
      heartRate: 72,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      painLevel: 2,
      status: 'waiting' as const
    },
    // Medium priority - Injury
    {
      patientIndex: 3,
      symptoms: 'Sprained ankle from fall, swelling and pain when walking',
      temperature: 98.4,
      heartRate: 85,
      bloodPressureSystolic: 125,
      bloodPressureDiastolic: 82,
      painLevel: 7,
      status: 'waiting' as const
    },
    // Low priority - Follow-up
    {
      patientIndex: 4,
      symptoms: 'Routine medication refill and general check-up',
      temperature: 98.2,
      heartRate: 68,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      painLevel: 1,
      status: 'waiting' as const
    }
  ];

  let position = 1;

  for (const scenario of visitScenarios) {
    // Calculate triage score and level
    const triageResult = calculateTriageScore({
      temperature: scenario.temperature,
      heartRate: scenario.heartRate,
      bloodPressureSystolic: scenario.bloodPressureSystolic,
      bloodPressureDiastolic: scenario.bloodPressureDiastolic,
      painLevel: scenario.painLevel,
      symptoms: scenario.symptoms
    });

    // Calculate estimated wait time based on queue position
    const estimatedWaitTime = calculateEstimatedWaitTime(position - 1);

    // Create visit record
    const visit = new Visit({
      patient: patients[scenario.patientIndex]._id,
      symptoms: scenario.symptoms,
      vitals: {
        temperature: scenario.temperature,
        heartRate: scenario.heartRate,
        bloodPressureSystolic: scenario.bloodPressureSystolic,
        bloodPressureDiastolic: scenario.bloodPressureDiastolic,
        painLevel: scenario.painLevel
      },
      triageLevel: triageResult.level,
      triageScore: triageResult.score,
      estimatedWaitTime: estimatedWaitTime,
      checkInTime: new Date(now.getTime() - (position * 15 * 60 * 1000)) // Stagger check-in times
    });

    const savedVisit = await visit.save();
    visits.push(savedVisit);

    // Create corresponding queue entry
    const queueEntry = new Queue({
      visit: savedVisit._id,
      patient: patients[scenario.patientIndex]._id,
      position: position,
      priority: triageResult.level,
      status: scenario.status,
      estimatedWaitTime: estimatedWaitTime,
      checkInTime: visit.checkInTime,
      // For in-progress visits, assign doctor and room
      ...(scenario.status === 'in-progress' && {
        doctor: doctors[0]._id,
        assignedRoom: scenario.room,
        calledTime: new Date(now.getTime() - 10 * 60 * 1000), // Called 10 minutes ago
        consultationStartTime: new Date(now.getTime() - 5 * 60 * 1000) // Started 5 minutes ago
      })
    });

    await queueEntry.save();
    position++;
  }

  return visits;
}

/**
 * Displays demo information and credentials
 */
function displayDemoInfo(
  staffMembers: any[], 
  patients: any[], 
  appointments: any[], 
  visits: any[]
): void {
  console.log('\n📋 DEMO ENVIRONMENT INFORMATION');
  console.log('==========================================');

  console.log('\n👥 STAFF CREDENTIALS:');
  console.log('------------------------------------------');
  staffMembers.forEach(staff => {
    console.log(`   👤 ${staff.firstName} ${staff.lastName}`);
    console.log(`      Email: ${staff.email}`);
    console.log(`      Password: ${staff.role === 'admin' ? (staff.email === 'admin@clinic.com' ? 'Admin123!' : 'password123') : 'password123'}`);
    console.log(`      Role: ${staff.role}`);
    if (staff.specialty) console.log(`      Specialty: ${staff.specialty}`);
    console.log('');
  });

  console.log('\n🔐 ADMIN ACCESS:');
  console.log('------------------------------------------');
  console.log('   👑 System Administrator:');
  console.log('      Email: admin@clinic.com');
  console.log('      Password: Admin123!');
  console.log('      ⚠️  Change this password immediately in production!');

  console.log('\n📊 DATA SUMMARY:');
  console.log('------------------------------------------');
  console.log(`   • Staff Members: ${staffMembers.length}`);
  console.log(`   • Patients: ${patients.length}`);
  console.log(`   • Appointments: ${appointments.length}`);
  console.log(`   • Active Visits: ${visits.length}`);

  console.log('\n🚑 CURRENT QUEUE STATUS:');
  console.log('------------------------------------------');
  console.log('   Position  Patient           Priority  Status');
  console.log('   ----------------------------------------');
  
  // This would normally come from the database, but for demo we'll simulate
  const queueStatus = [
    { position: 1, patient: 'John Smith', priority: 'HIGH', status: 'IN-PROGRESS' },
    { position: 2, patient: 'Sarah Johnson', priority: 'MEDIUM', status: 'WAITING' },
    { position: 3, patient: 'Robert Chen', priority: 'LOW', status: 'WAITING' },
    { position: 4, patient: 'Maria Garcia', priority: 'MEDIUM', status: 'WAITING' },
    { position: 5, patient: 'James Wilson', priority: 'LOW', status: 'WAITING' }
  ];

  queueStatus.forEach(entry => {
    const priorityIcon = entry.priority === 'HIGH' ? '🔴' : entry.priority === 'MEDIUM' ? '🟡' : '🟢';
    console.log(`   ${entry.position.toString().padEnd(9)} ${entry.patient.padEnd(17)} ${priorityIcon} ${entry.priority.padEnd(6)} ${entry.status}`);
  });

  console.log('\n🔧 TESTING SCENARIOS:');
  console.log('------------------------------------------');
  console.log('   1. 🔐 Login as admin to access all features');
  console.log('   2. 📋 View current queue and patient details');
  console.log('   3. 🏥 Process patient check-in with different symptoms');
  console.log('   4. 📅 Schedule and manage appointments');
  console.log('   5. 👨‍⚕️ Update queue status (waiting → in-progress → completed)');
  console.log('   6. 📊 View dashboard statistics');
  console.log('   7. 🔍 Search patients and view medical history');
  console.log('   8. 👥 Register new staff members (admin only)');

  console.log('\n🚀 QUICK START:');
  console.log('------------------------------------------');
  console.log('   1. Use "admin@clinic.com / Admin123!" to login as admin');
  console.log('   2. Navigate to Queue Management to see demo patients');
  console.log('   3. Test triage system with different symptom combinations');
  console.log('   4. Explore appointment scheduling features');
  console.log('   5. Use admin features to register new staff members');

  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('------------------------------------------');
  console.log('   • This is DEMO data - do not use in production!');
  console.log('   • All passwords are simple for testing purposes');
  console.log('   • Data will be reset when re-running seed script');
  console.log('   • Modify seed data to match your testing needs');
  console.log('   • First user registration automatically becomes admin');
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };