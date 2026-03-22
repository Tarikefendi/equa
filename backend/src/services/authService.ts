import bcrypt from 'bcrypt';
import pool from '../config/database';
import { RegisterDTO, LoginDTO } from '../types';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import logger from '../config/logger';
import { randomBytes } from 'crypto';
import { VerificationService } from './verificationService';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const verificationService = new VerificationService();

export class AuthService {
  async register(data: RegisterDTO & { ipAddress?: string; deviceFingerprint?: string }) {
    const { email, username, password, ipAddress, deviceFingerprint } = data;

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, device_fingerprint, last_ip) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, username, passwordHash, deviceFingerprint || null, ipAddress || null]
    );

    const userResult = await pool.query(
      'SELECT id, email, username, role, created_at FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    await pool.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [userId]);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, refreshToken, expiresAt]
    );

    try {
      await verificationService.sendVerificationEmail(userId);
      logger.info(`Verification email sent to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send verification email: ${error}`);
    }

    logger.info(`New user registered: ${user.email}`);

    return {
      user: { id: user.id, email: user.email, username: user.username },
      token: accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDTO & { ipAddress?: string; deviceFingerprint?: string }) {
    const { email, password, ipAddress, deviceFingerprint } = data;

    const userResult = await pool.query(
      'SELECT id, email, username, password_hash, role, entity_id FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    if (ipAddress || deviceFingerprint) {
      await pool.query(
        'UPDATE users SET last_ip = $1, device_fingerprint = $2 WHERE id = $3',
        [ipAddress || null, deviceFingerprint || null, user.id]
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
      entity_id: user.entity_id || undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    logger.info(`User logged in: ${user.email}`);

    return {
      user: { id: user.id, email: user.email, username: user.username },
      token: accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.reputation, u.is_public, u.created_at, u.is_verified, u.role,
              p.full_name, p.bio, p.avatar_url, p.country, p.language
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (!result.rows[0]) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  async updateProfile(userId: string, data: { is_public?: boolean }) {
    if (data.is_public !== undefined) {
      await pool.query(
        'UPDATE users SET is_public = $1 WHERE id = $2',
        [data.is_public, userId]
      );
    }
    return this.getProfile(userId);
  }
}
