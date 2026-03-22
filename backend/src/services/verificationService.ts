import pool from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email';

export class VerificationService {
  async createVerificationToken(userId: string, type: 'email_verification' | 'password_reset') {
    const tokenId = randomBytes(16).toString('hex');
    const token = randomBytes(32).toString('hex');

    const hoursToAdd = type === 'email_verification' ? 24 : 1;

    await pool.query(
      `INSERT INTO verification_tokens (id, user_id, token, type, expires_at) VALUES ($1,$2,$3,$4, NOW() + INTERVAL '${hoursToAdd} hours')`,
      [tokenId, userId, token, type]
    );

    logger.info(`Verification token created: ${type} for user ${userId}`);
    return token;
  }

  async verifyEmailToken(token: string) {
    const verificationToken = (await pool.query(
      `SELECT * FROM verification_tokens
       WHERE token = $1 AND type = 'email_verification' AND expires_at > NOW()`,
      [token]
    )).rows[0];

    if (!verificationToken) throw new Error('Invalid or expired verification token');

    await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [verificationToken.user_id]);
    await pool.query('DELETE FROM verification_tokens WHERE id = $1', [verificationToken.id]);

    logger.info(`Email verified for user ${verificationToken.user_id}`);
    return { message: 'Email verified successfully' };
  }

  async sendVerificationEmail(userId: string) {
    const user = (await pool.query(
      'SELECT email, username, is_verified FROM users WHERE id = $1',
      [userId]
    )).rows[0];

    if (!user) throw new Error('User not found');
    if (user.is_verified) throw new Error('Email already verified');

    await pool.query(
      `DELETE FROM verification_tokens WHERE user_id = $1 AND type = 'email_verification'`,
      [userId]
    );

    const token = await this.createVerificationToken(userId, 'email_verification');
    await sendVerificationEmail(user.email, user.username, token);
    return { message: 'Verification email sent' };
  }

  async requestPasswordReset(email: string) {
    const user = (await pool.query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    )).rows[0];

    if (!user) return { message: 'If the email exists, a password reset link has been sent' };

    await pool.query(
      `DELETE FROM verification_tokens WHERE user_id = $1 AND type = 'password_reset'`,
      [user.id]
    );

    const token = await this.createVerificationToken(user.id, 'password_reset');
    await sendPasswordResetEmail(email, user.username, token);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async verifyPasswordResetToken(token: string) {
    const verificationToken = (await pool.query(
      `SELECT * FROM verification_tokens
       WHERE token = $1 AND type = 'password_reset' AND expires_at > NOW()`,
      [token]
    )).rows[0];

    if (!verificationToken) throw new Error('Invalid or expired reset token');
    return { user_id: verificationToken.user_id };
  }

  async resetPassword(token: string, newPasswordHash: string) {
    const verification = await this.verifyPasswordResetToken(token);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, verification.user_id]);
    await pool.query('DELETE FROM verification_tokens WHERE token = $1', [token]);

    logger.info(`Password reset for user ${verification.user_id}`);
    return { message: 'Password reset successfully' };
  }
}
