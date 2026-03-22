import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { VerificationService } from '../services/verificationService';
import { AuthRequest } from '../types';
import logger from '../config/logger';
import bcrypt from 'bcrypt';

const authService = new AuthService();
const verificationService = new VerificationService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Extract IP and device fingerprint
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const deviceFingerprint = req.body.deviceFingerprint;

      const result = await authService.register({
        ...req.body,
        ipAddress,
        deviceFingerprint
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      // Extract IP and device fingerprint
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const deviceFingerprint = req.body.deviceFingerprint;

      const result = await authService.login({
        ...req.body,
        ipAddress,
        deviceFingerprint
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const profile = await authService.getProfile(req.user.id);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to get profile' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { is_public } = req.body;
      const updated = await authService.updateProfile(req.user.id, { is_public });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update profile' });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }

      const result = await verificationService.verifyEmailToken(token);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Email verification failed',
      });
    }
  }

  async resendVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await verificationService.sendVerificationEmail(req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resend verification',
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const result = await verificationService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to process password reset request',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: 'Token and password are required',
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const result = await verificationService.resetPassword(token, passwordHash);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      });
    }
  }
}
