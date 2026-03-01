import { Request, Response, NextFunction } from 'express';
import { CaptchaService } from '../services/captchaService';
import logger from '../config/logger';

const captchaService = new CaptchaService();
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';

export const verifyCaptcha = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip CAPTCHA in development if no secret key configured
    if (!RECAPTCHA_SECRET_KEY) {
      logger.warn('⚠️ CAPTCHA verification skipped - no secret key configured');
      return next();
    }

    const captchaToken = req.body.captchaToken || req.headers['x-captcha-token'];

    // Skip if no token in development
    if (!captchaToken && process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ CAPTCHA token missing - skipped in development');
      return next();
    }

    if (!captchaToken) {
      logger.warn('CAPTCHA token missing');
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification required',
      });
    }

    try {
      const isValid = await captchaService.verifyCaptcha(captchaToken, action);

      if (!isValid) {
        return res.status(403).json({
          success: false,
          message: 'CAPTCHA verification failed. Please try again.',
        });
      }

      next();
    } catch (error) {
      logger.error('CAPTCHA middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'CAPTCHA verification error',
      });
    }
  };
};
