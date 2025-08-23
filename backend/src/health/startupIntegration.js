import { databaseHealthCheck } from './databaseHealthCheck.js';
import { logger } from '../utils/logger.js';

/**
 * Startup Integration for Database Health Checks
 * Integrates health checks into the application startup process
 */
export class StartupIntegration {
  constructor() {
    this.healthCheckEnabled = process.env.HEALTH_CHECK_ENABLED !== 'false';
    this.failOnHealthCheckError = process.env.FAIL_ON_HEALTH_CHECK_ERROR === 'true';
    this.healthCheckTimeout = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '30000');
  }

  /**
   * Run startup health checks
   */
  async runStartupHealthChecks() {
    if (!this.healthCheckEnabled) {
      logger.info('🏥 Database health checks disabled');
      return { status: 'skipped', reason: 'disabled' };
    }

    logger.info('🚀 Running startup health checks...');
    
    try {
      const healthResults = await Promise.race([
        databaseHealthCheck.runHealthCheck(),
        this.createTimeoutPromise()
      ]);

      // Log results
      databaseHealthCheck.logResults(healthResults);

      // Handle results based on configuration
      if (healthResults.status === 'failed' && this.failOnHealthCheckError) {
        logger.error('💥 Startup failed due to health check errors');
        logger.error('Set FAIL_ON_HEALTH_CHECK_ERROR=false to start with warnings');
        process.exit(1);
      } else if (healthResults.status === 'failed') {
        logger.warn('⚠️ Starting with health check warnings (non-blocking mode)');
      }

      return healthResults;
    } catch (error) {
      logger.error('🔥 Startup health check failed:', error);
      
      if (this.failOnHealthCheckError) {
        logger.error('💥 Startup failed due to health check timeout/error');
        process.exit(1);
      }
      
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Create timeout promise for health checks
   */
  createTimeoutPromise() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout after ${this.healthCheckTimeout}ms`));
      }, this.healthCheckTimeout);
    });
  }

  /**
   * Add health check endpoint to Express app
   */
  addHealthEndpoint(app) {
    app.get('/health/database', async (req, res) => {
      try {
        const healthResults = await databaseHealthCheck.runHealthCheck();
        
        const statusCode = healthResults.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
          status: healthResults.status,
          timestamp: healthResults.timestamp,
          checks: {
            connectivity: healthResults.connectivity?.status === 'connected',
            tables: healthResults.tables?.status === 'success',
            functions: healthResults.functions?.status === 'success'
          },
          details: {
            connectivity: healthResults.connectivity,
            tables: {
              validated: Object.keys(healthResults.tables?.tables || {}).length,
              missing: healthResults.tables?.missingTables || [],
              errors: healthResults.tables?.errors || []
            },
            functions: {
              validated: Object.keys(healthResults.functions?.functions || {}).length,
              missing: healthResults.functions?.missingFunctions || [],
              errors: healthResults.functions?.errors || []
            }
          },
          suggestions: healthResults.suggestions,
          duration: `${healthResults.duration}ms`
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    logger.info('🏥 Database health endpoint added: /health/database');
  }

  /**
   * Enhanced health check endpoint with detailed information
   */
  addDetailedHealthEndpoint(app) {
    app.get('/health/database/detailed', async (req, res) => {
      try {
        const healthResults = await databaseHealthCheck.runHealthCheck();
        
        const statusCode = healthResults.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
          ...healthResults,
          environment: {
            nodeEnv: process.env.NODE_ENV,
            supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
            healthCheckEnabled: this.healthCheckEnabled,
            failOnError: this.failOnHealthCheckError,
            timeout: this.healthCheckTimeout
          }
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message,
          environment: {
            nodeEnv: process.env.NODE_ENV,
            supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
            healthCheckEnabled: this.healthCheckEnabled,
            failOnError: this.failOnHealthCheckError
          }
        });
      }
    });

    logger.info('🔍 Detailed database health endpoint added: /health/database/detailed');
  }

  /**
   * Add monitoring hooks for ongoing health checks
   */
  setupHealthMonitoring(app) {
    // Add middleware to check database health on critical routes
    const criticalRoutes = ['/api/contributions', '/api/campaign'];
    
    criticalRoutes.forEach(route => {
      app.use(route, async (req, res, next) => {
        // Skip health check for GET requests to reduce overhead
        if (req.method === 'GET') {
          return next();
        }

        try {
          const connectivity = await databaseHealthCheck.checkConnectivity();
          
          if (connectivity.status === 'failed') {
            logger.warn(`Database connectivity issue on ${req.method} ${req.path}`);
            
            return res.status(503).json({
              error: 'Database temporarily unavailable',
              code: 'DATABASE_UNAVAILABLE',
              timestamp: new Date().toISOString()
            });
          }
          
          next();
        } catch (error) {
          logger.error(`Health check middleware error on ${req.method} ${req.path}:`, error);
          next(); // Continue anyway to avoid blocking requests
        }
      });
    });

    logger.info('🔍 Health monitoring middleware added to critical routes');
  }
}

export const startupIntegration = new StartupIntegration();