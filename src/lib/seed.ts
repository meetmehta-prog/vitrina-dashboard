import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import { db } from './db';
import { allowedUsers } from './schema';

export async function seedAllowedUsers() {
  try {
    // Add some test users to the allowed users table
    const testUsers = [
      { email: 'admin@vitrina.com', name: 'Admin User', isActive: true },
      { email: 'test@example.com', name: 'Test User', isActive: true },
      { email: 'demo@vitrina.com', name: 'Demo User', isActive: true }
    ];

    for (const user of testUsers) {
      try {
        await db.insert(allowedUsers).values(user).onConflictDoNothing();
        console.log(`✅ Added user: ${user.email}`);
      } catch (error) {
        console.log(`ℹ️  User ${user.email} already exists`);
      }
    }

    console.log('✅ Seeding completed');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAllowedUsers().then(() => process.exit(0));
}