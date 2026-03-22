import pool from '../config/database';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    const passwordHash = await bcrypt.hash('Demo123!@#', 12);
    const userId = randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, is_verified)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO NOTHING`,
      [userId, 'demo@boycott.com', 'demo_user', passwordHash, true]
    );

    await pool.query(
      `INSERT INTO user_profiles (user_id, full_name, bio, country)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, 'Demo User', 'This is a demo account', 'Turkey']
    );

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
