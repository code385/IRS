/**
 * Firebase Seed Script
 * 
 * Ye script Firebase me initial data seed karega:
 * - Sample users (Super Admin, Admin, Manager, Employee)
 * - Sample timesheets (Draft, Submitted, Approved)
 * 
 * Usage:
 *   npm run seed
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Firebase Admin SDK initialize karein
let serviceAccount: any;

try {
  // Service account key file path (Firebase Console > Project Settings > Service Accounts)
  const serviceAccountPath = join(__dirname, '../firebase-service-account-key.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  console.log('✅ Firebase Admin initialized from service account key');
} catch (error: any) {
  // Agar service account key nahi mili, to project ID se try karein (for emulator/testing)
  const projectId = process.env.FIREBASE_PROJECT_ID || 'hashtimesheet';
  try {
    admin.initializeApp({
      projectId: projectId,
    });
    console.log(`✅ Firebase Admin initialized with project ID: ${projectId}`);
    console.log('⚠️  Note: Using default credentials. For production, use service account key.');
  } catch (initError: any) {
    console.error('❌ Firebase Admin initialization failed!');
    console.error('Please provide either:');
    console.error('1. firebase-service-account-key.json file in mobile/ directory');
    console.error('2. Or set FIREBASE_PROJECT_ID environment variable');
    console.error('\nTo get service account key:');
    console.error('   Firebase Console → Project Settings → Service Accounts → Generate new private key');
    process.exit(1);
  }
}

const db = admin.firestore();

// Helper function: Date format DD/MM/YYYY
function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Helper function: Get week start date (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
}

// Helper function: Get week end date (Sunday)
function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return end;
}

// Helper function: Generate week ID (ISO date format)
function getWeekId(weekEnd: Date): string {
  return weekEnd.toISOString().slice(0, 10);
}

// Sample users data
const sampleUsers = [
  {
    email: 'superadmin@irs.com',
    password: 'SuperAdmin123!',
    name: 'Super Admin',
    role: 'Super Admin',
    status: 'Active',
  },
  {
    email: 'admin@irs.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'Admin',
    status: 'Active',
  },
  {
    email: 'manager@irs.com',
    password: 'Manager123!',
    name: 'Manager User',
    role: 'Manager',
    status: 'Active',
  },
  {
    email: 'employee1@irs.com',
    password: 'Employee123!',
    name: 'John Doe',
    role: 'Employee',
    status: 'Active',
  },
  {
    email: 'employee2@irs.com',
    password: 'Employee123!',
    name: 'Jane Smith',
    role: 'Employee',
    status: 'Active',
  },
];

// Sample timesheets data
async function createSampleTimesheets(employeeUid: string, employeeName: string) {
  const now = new Date();
  const timesheets = [];

  // Last 4 weeks ke timesheets create karein
  for (let i = 0; i < 4; i++) {
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - (i * 7) - (now.getDay() === 0 ? 7 : now.getDay() - 1));
    const weekStart = getWeekStart(weekStartDate);
    const weekEnd = getWeekEnd(weekStart);
    
    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);
    const weekId = getWeekId(weekEnd);
    const weekLabel = `Weekend of ${weekEndStr}`;

    // Days array (Monday to Sunday)
    const days = [];
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    for (let j = 0; j < 7; j++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + j);
      const dayLabel = `${dayLabels[j]}, ${formatDate(dayDate)}`;
      
      // Random hours (0 to 10, mostly 8-9 for weekdays)
      let hours = 0;
      if (j < 5) {
        // Weekdays: 7-9 hours
        hours = Math.round((7 + Math.random() * 2) * 100) / 100;
      } else {
        // Weekends: 0-4 hours (sometimes)
        hours = Math.random() > 0.7 ? Math.round(Math.random() * 4 * 100) / 100 : 0;
      }

      days.push({
        id: dayIds[j],
        label: dayLabel,
        hours: hours,
      });
    }

    // Status based on week index
    let status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' = 'Draft';
    if (i === 0) {
      status = 'Draft'; // Current week: Draft
    } else if (i === 1) {
      status = 'Submitted'; // Last week: Submitted
    } else if (i === 2) {
      status = 'Approved'; // 2 weeks ago: Approved
    } else {
      status = 'Approved'; // 3 weeks ago: Approved
    }

    const timesheetData: any = {
      id: weekId,
      label: weekLabel,
      weekStart: weekStartStr,
      status: status,
      employeeId: employeeUid,
      employeeName: employeeName,
      days: days,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (status !== 'Draft') {
      timesheetData.submittedAt = admin.firestore.Timestamp.now();
    }

    // Only Approved timesheets have reviewedAt (we're not creating Rejected in seed)
    if (status === 'Approved') {
      timesheetData.reviewedAt = admin.firestore.Timestamp.now();
    }

    timesheets.push({ weekId, data: timesheetData });
  }

  return timesheets;
}

// Main seed function
async function seedFirebase() {
  console.log('\n🌱 Starting Firebase seed...\n');

  try {
    // 1. Create users in Firebase Auth and Firestore
    console.log('📝 Creating users...');
    const userIds: { [email: string]: string } = {};

    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        let userRecord;
        try {
          userRecord = await admin.auth().getUserByEmail(userData.email);
          console.log(`   ⚠️  User ${userData.email} already exists, skipping Auth creation`);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            // Create new user
            userRecord = await admin.auth().createUser({
              email: userData.email,
              password: userData.password,
              displayName: userData.name,
            });
            console.log(`   ✅ Created Auth user: ${userData.email}`);
          } else {
            throw error;
          }
        }

        const uid = userRecord.uid;
        userIds[userData.email] = uid;

        // Create/Update Firestore user document
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          await userDocRef.set({
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            created: formatDate(new Date()),
          });
          console.log(`   ✅ Created Firestore user: ${userData.name}`);
        } else {
          console.log(`   ⚠️  Firestore user ${userData.name} already exists, skipping`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    // 2. Create timesheets for employees
    console.log('\n📊 Creating timesheets...');
    const employeeEmails = sampleUsers.filter((u) => u.role === 'Employee');
    
    for (const employee of employeeEmails) {
      const uid = userIds[employee.email];
      if (!uid) {
        console.log(`   ⚠️  Skipping timesheets for ${employee.email} (user not found)`);
        continue;
      }

      try {
        const timesheets = await createSampleTimesheets(uid, employee.name);
        
        for (const { weekId, data } of timesheets) {
          // Use employee-specific week ID to avoid conflicts
          const uniqueWeekId = `${weekId}_${uid}`;
          const timesheetRef = db.collection('timesheets').doc(uniqueWeekId);
          const timesheetDoc = await timesheetRef.get();

          if (!timesheetDoc.exists) {
            await timesheetRef.set(data);
            console.log(`   ✅ Created timesheet: ${data.label} (${data.status}) for ${employee.name}`);
          } else {
            console.log(`   ⚠️  Timesheet ${data.label} already exists for ${employee.name}, skipping`);
          }
        }
      } catch (error: any) {
        console.error(`   ❌ Error creating timesheets for ${employee.email}:`, error.message);
      }
    }

    console.log('\n✅ Firebase seed completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Users created: ${sampleUsers.length}`);
    console.log(`   - Timesheets created: ${employeeEmails.length * 4} (4 weeks per employee)`);
    console.log('\n🔑 Login Credentials:');
    sampleUsers.forEach((u) => {
      console.log(`   ${u.role}: ${u.email} / ${u.password}`);
    });
    console.log('\n');
  } catch (error: any) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seedFirebase()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
