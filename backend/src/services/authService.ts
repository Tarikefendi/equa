import bcrypt from 'bcrypt';
import db from '../config/database';
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

    // Check if user exists
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email, username);

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Generate user ID
    const userId = randomBytes(16).toString('hex');

    // Create user with device fingerprint and IP
    const insertUser = db.prepare(
      `INSERT INTO users (id, email, username, password_hash, device_fingerprint, last_ip) 
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    insertUser.run(userId, email, username, passwordHash, deviceFingerprint || null, ipAddress || null);

    const user = db.prepare(
      'SELECT id, email, username, role, created_at FROM users WHERE id = ?'
    ).get(userId) as any;

    // Create user profile
    db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(userId);

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(userId, refreshToken, expiresAt);

    // Send verification email
    try {
      await verificationService.sendVerificationEmail(userId);
      logger.info(`Verification email sent to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send verification email: ${error}`);
      // Don't fail registration if email fails
    }

    logger.info(`New user registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token: accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDTO & { ipAddress?: string; deviceFingerprint?: string }) {
    const { email, password, ipAddress, deviceFingerprint } = data;

    // Find user with role
    const user = db.prepare(
      'SELECT id, email, username, password_hash, role FROM users WHERE email = ?'
    ).get(email) as any;

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last IP and device fingerprint
    if (ipAddress || deviceFingerprint) {
      db.prepare(
        'UPDATE users SET last_ip = ?, device_fingerprint = ? WHERE id = ?'
      ).run(ipAddress || null, deviceFingerprint || null, user.id);
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, refreshToken, expiresAt);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token: accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const profile = db.prepare(
      `SELECT u.id, u.email, u.username, u.reputation_score, u.created_at, u.is_verified, u.role,
              p.full_name, p.bio, p.avatar_url, p.country, p.language
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`
    ).get(userId);

    if (!profile) {
      throw new Error('User not found');
    }

    return profile;
  }
}
