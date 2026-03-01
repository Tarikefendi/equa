import axios from 'axios';
import logger from '../config/logger';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

export class CaptchaService {
  async verifyCaptcha(token: string, action: string): Promise<boolean> {
    // Skip verification in development if no secret key
    if (!RECAPTCHA_SECRET_KEY) {
      logger.warn('⚠️ CAPTCHA verification skipped - no secret key configured');
      return true;
    }

    try {
      const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        },
      });

      const { success, score, action: responseAction } = response.data;

      if (!success) {
        logger.warn('CAPTCHA verification failed', response.data);
        return false;
      }

      // Verify action matches
      if (responseAction !== action) {
        logger.warn(`CAPTCHA action mismatch: expected ${action}, got ${responseAction}`);
        return false;
      }

      // Check score (0.0 = bot, 1.0 = human)
      if (score < MIN_SCORE) {
        logger.warn(`CAPTCHA score too low: ${score} (min: ${MIN_SCORE})`);
        return false;
      }

      logger.info(`CAPTCHA verified successfully: score ${score}, action ${action}`);
      return true;
    } catch (error) {
      logger.error('CAPTCHA verification error:', error);
      return false;
    }
  }
}
