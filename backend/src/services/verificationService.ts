import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email';

export class VerificationService {
  async createVerificationToken(userId: string, type: 'email_verification' | 'password_reset') {
    const tokenId = randomBytes(16).toString('hex');
    const token = randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    if (type === 'email_verification') {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
    } else {
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour
    }

    db.prepare(
      `INSERT INTO verification_tokens (id, user_id, token, type, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(tokenId, userId, token, type, expiresAt.toISOString());

    logger.info(`Verification token created: ${type} for user ${userId}`);

    return token;
  }

  async verifyEmailToken(token: string) {
    const verificationToken = db.prepare(
      `SELECT * FROM verification_tokens 
       WHERE token = ? AND type = 'email_verification' AND expires_at > datetime('now')`
    ).get(token) as any;

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    // Update user as verified
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(verificationToken.user_id);

    // Delete used token
    db.prepare('DELETE FROM verification_tokens WHERE id = ?').run(verificationToken.id);

    logger.info(`Email verified for user ${verificationToken.user_id}`);

    return { message: 'Email verified successfully' };
  }

  async sendVerificationEmail(userId: string) {
    const user = db.prepare('SELECT email, username, is_verified FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_verified) {
      throw new Error('Email already verified');
    }

    // Delete old tokens
    db.prepare(
      `DELETE FROM verification_tokens 
       WHERE user_id = ? AND type = 'email_verification'`
    ).run(userId);

    const token = await this.createVerificationToken(userId, 'email_verification');

    await sendVerificationEmail(user.email, user.username, token);

    return { message: 'Verification email sent' };
  }

  async requestPasswordReset(email: string) {
    const user = db.prepare('SELECT id, username FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Delete old tokens
    db.prepare(
      `DELETE FROM verification_tokens 
       WHERE user_id = ? AND type = 'password_reset'`
    ).run(user.id);

    const token = await this.createVerificationToken(user.id, 'password_reset');

    await sendPasswordResetEmail(email, user.username, token);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async verifyPasswordResetToken(token: string) {
    const verificationToken = db.prepare(
      `SELECT * FROM verification_tokens 
       WHERE token = ? AND type = 'password_reset' AND expires_at > datetime('now')`
    ).get(token) as any;

    if (!verificationToken) {
      throw new Error('Invalid or expired reset token');
    }

    return { user_id: verificationToken.user_id };
  }

  async resetPassword(token: string, newPasswordHash: string) {
    const verification = await this.verifyPasswordResetToken(token);

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, verification.user_id);

    // Delete used token
    db.prepare('DELETE FROM verification_tokens WHERE token = ?').run(token);

    logger.info(`Password reset for user ${verification.user_id}`);

    return { message: 'Password reset successfully' };
  }
}
