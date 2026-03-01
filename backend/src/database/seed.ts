import db from '../config/database';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');
    
    // Create demo user
    const passwordHash = await bcrypt.hash('Demo123!@#', 12);
    const userId = randomBytes(16).toString('hex');
    
    const insertUser = db.prepare(
      `INSERT INTO users (id, email, username, password_hash, is_verified) 
       VALUES (?, ?, ?, ?, ?)`
    );
    
    insertUser.run(userId, 'demo@boycott.com', 'demo_user', passwordHash, 1);
    
    // Create demo profile
    const insertProfile = db.prepare(
      `INSERT INTO user_profiles (user_id, full_name, bio, country) 
       VALUES (?, ?, ?, ?)`
    );
    
    insertProfile.run(userId, 'Demo User', 'This is a demo account', 'Turkey');
    
    console.log('✅ Database seeded successfully');
    console.log('📧 Demo user: demo@boycott.com');
    console.log('🔑 Password: Demo123!@#');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
