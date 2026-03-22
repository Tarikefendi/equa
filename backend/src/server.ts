import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import logger from './config/logger';
import { CampaignClosureService } from './services/campaignClosureService';
import { EntityMetricsService } from './services/entityMetricsService';
import { EntityTransparencyService } from './services/EntityTransparencyService';
import { LawyerService } from './services/LawyerService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Boycott Platform API Docs',
}));

// Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
      logger.info(`📚 Docs: http://localhost:${PORT}/api/v1/docs`);
      logger.info(`🏥 Health: http://localhost:${PORT}/api/v1/health`);
    });

    // Daily auto-archive job (runs every 24 hours)
    const closureService = new CampaignClosureService();
    const runAutoArchive = async () => {
      try {
        const result = await closureService.autoArchiveInactive();
        logger.info(`Auto-archive job completed: ${result.archived} campaign(s) archived.`);
      } catch (err) {
        logger.error('Auto-archive job failed:', err);
      }
    };
    // Run once on startup, then every 24 hours
    runAutoArchive();
    setInterval(runAutoArchive, 24 * 60 * 60 * 1000);

    // Daily response deadline check job
    const runDeadlineCheck = async () => {
      try {
        const result = await closureService.checkResponseDeadlines();
        logger.info(`Deadline check job completed: ${result.processed} campaign(s) marked no_response.`);
      } catch (err) {
        logger.error('Deadline check job failed:', err);
      }
    };
    runDeadlineCheck();
    setInterval(runDeadlineCheck, 24 * 60 * 60 * 1000);

    // Daily entity metrics recalculation job
    const metricsService = new EntityMetricsService();
    const runMetricsRecalc = async () => {
      try {
        const result = await metricsService.recalculateAll();
        logger.info(`Entity metrics job completed: ${result.processed} entities processed.`);
      } catch (err) {
        logger.error('Entity metrics job failed:', err);
      }
    };
    runMetricsRecalc();
    setInterval(runMetricsRecalc, 24 * 60 * 60 * 1000);

    // Daily transparency score recalculation job
    const transparencyService = new EntityTransparencyService();
    const runTransparencyRecalc = async () => {
      try {
        const result = await transparencyService.recalculateAllEntities();
        logger.info(`Transparency score job completed: ${result.processed} entities processed.`);
      } catch (err) {
        logger.error('Transparency score job failed:', err);
      }
    };
    runTransparencyRecalc();
    setInterval(runTransparencyRecalc, 24 * 60 * 60 * 1000);

    // Lawyer match timeout check (every 6 hours — 48h timeout)
    const lawyerService = new LawyerService();
    const runMatchTimeoutCheck = async () => {
      try {
        const count = await lawyerService.checkMatchTimeouts();
        if (count > 0) logger.info(`Lawyer timeout check: ${count} match(es) reopened.`);
      } catch (err) {
        logger.error('Lawyer timeout check failed:', err);
      }
    };
    runMatchTimeoutCheck();
    setInterval(runMatchTimeoutCheck, 6 * 60 * 60 * 1000);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
