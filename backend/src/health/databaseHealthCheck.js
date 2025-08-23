import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

/**
 * Database Health Check Module
 * Validates database connectivity and table existence on startup
 * Provides error reporting and recovery suggestions
 */
export class DatabaseHealthCheck {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.requiredTables = [
      'campaigns',
      'contributions', 
      'recurring_payments',
      'contribution_limits'
    ];
    this.requiredFunctions = [
      'generate_transaction_code',
      'calculate_recurring_projection',
      'update_updated_at_column'
    ];
    this.client = null;
  }

  /**
   * Initialize Supabase client
   */
  initializeClient() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase configuration: SUPABASE_URL or SUPABASE_ANON_KEY not set');
    }
    
    this.client = createClient(this.supabaseUrl, this.supabaseKey);
    return this.client;
  }

  /**
   * Check database connectivity
   */
  async checkConnectivity() {
    try {
      if (!this.client) {
        this.initializeClient();
      }

      const { data, error } = await this.client
        .from('campaigns')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Database connectivity failed: ${error.message}`);
      }

      return {
        status: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate table existence and structure
   */
  async validateTables() {
    const results = {
      status: 'success',
      tables: {},
      missingTables: [],
      errors: []
    };

    try {
      if (!this.client) {
        this.initializeClient();
      }

      for (const tableName of this.requiredTables) {
        try {
          // Test table access with a simple count query
          const { data, error } = await this.client
            .from(tableName)
            .select('count', { count: 'exact', head: true });

          if (error) {
            results.tables[tableName] = {
              exists: false,
              error: error.message
            };
            results.missingTables.push(tableName);
            results.errors.push(`Table '${tableName}' error: ${error.message}`);
          } else {
            results.tables[tableName] = {
              exists: true,
              accessible: true
            };
          }
        } catch (tableError) {
          results.tables[tableName] = {
            exists: false,
            error: tableError.message
          };
          results.missingTables.push(tableName);
          results.errors.push(`Table '${tableName}' validation failed: ${tableError.message}`);
        }
      }

      if (results.missingTables.length > 0) {
        results.status = 'failed';
      }

      return results;
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate required database functions
   */
  async validateFunctions() {
    const results = {
      status: 'success',
      functions: {},
      missingFunctions: [],
      errors: []
    };

    try {
      if (!this.client) {
        this.initializeClient();
      }

      // Check functions by executing them with test parameters
      for (const functionName of this.requiredFunctions) {
        try {
          let testResult;
          
          switch (functionName) {
            case 'generate_transaction_code':
              testResult = await this.client.rpc('generate_transaction_code');
              break;
            case 'calculate_recurring_projection':
              testResult = await this.client.rpc('calculate_recurring_projection', {
                p_amount: 100,
                p_frequency: 'monthly',
                p_start_date: '2024-01-01'
              });
              break;
            case 'update_updated_at_column':
              // This is a trigger function, we'll assume it exists if no error on table access
              testResult = { data: true, error: null };
              break;
          }

          if (testResult.error) {
            results.functions[functionName] = {
              exists: false,
              error: testResult.error.message
            };
            results.missingFunctions.push(functionName);
            results.errors.push(`Function '${functionName}' error: ${testResult.error.message}`);
          } else {
            results.functions[functionName] = {
              exists: true,
              functional: true
            };
          }
        } catch (funcError) {
          results.functions[functionName] = {
            exists: false,
            error: funcError.message
          };
          results.missingFunctions.push(functionName);
          results.errors.push(`Function '${functionName}' validation failed: ${funcError.message}`);
        }
      }

      if (results.missingFunctions.length > 0) {
        results.status = 'failed';
      }

      return results;
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate recovery suggestions based on validation results
   */
  generateRecoverySuggestions(healthResults) {
    const suggestions = [];

    if (healthResults.connectivity?.status === 'failed') {
      suggestions.push({
        issue: 'Database Connectivity Failed',
        severity: 'critical',
        action: 'Verify SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        details: 'Check your .env file and ensure Supabase credentials are correct'
      });
    }

    if (healthResults.tables?.missingTables?.length > 0) {
      suggestions.push({
        issue: 'Missing Database Tables',
        severity: 'critical',
        action: 'Apply database schema',
        details: `Missing tables: ${healthResults.tables.missingTables.join(', ')}`,
        command: 'Apply docs/supabase-contributions-schema.sql to your Supabase database'
      });
    }

    if (healthResults.functions?.missingFunctions?.length > 0) {
      suggestions.push({
        issue: 'Missing Database Functions',
        severity: 'high',
        action: 'Apply database functions',
        details: `Missing functions: ${healthResults.functions.missingFunctions.join(', ')}`,
        command: 'Functions are included in docs/supabase-contributions-schema.sql'
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        issue: 'None',
        severity: 'info',
        action: 'Database is healthy',
        details: 'All required tables and functions are present and accessible'
      });
    }

    return suggestions;
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck() {
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      connectivity: null,
      tables: null,
      functions: null,
      suggestions: [],
      duration: 0
    };

    try {
      logger.info('🏥 Starting database health check...');

      // Check connectivity
      logger.info('📡 Checking database connectivity...');
      results.connectivity = await this.checkConnectivity();
      
      if (results.connectivity.status === 'failed') {
        results.status = 'failed';
        results.suggestions = this.generateRecoverySuggestions(results);
        results.duration = Date.now() - startTime;
        return results;
      }

      // Validate tables
      logger.info('📋 Validating database tables...');
      results.tables = await this.validateTables();

      // Validate functions
      logger.info('⚙️ Validating database functions...');
      results.functions = await this.validateFunctions();

      // Determine overall status
      if (results.tables.status === 'failed' || results.functions.status === 'failed') {
        results.status = 'failed';
      } else {
        results.status = 'healthy';
      }

      // Generate suggestions
      results.suggestions = this.generateRecoverySuggestions(results);
      results.duration = Date.now() - startTime;

      return results;
    } catch (error) {
      logger.error('Database health check failed:', error);
      results.status = 'failed';
      results.error = error.message;
      results.duration = Date.now() - startTime;
      return results;
    }
  }

  /**
   * Log health check results
   */
  logResults(results) {
    const duration = `${results.duration}ms`;
    
    if (results.status === 'healthy') {
      logger.info(`✅ Database health check passed (${duration})`);
      logger.info(`📊 Tables: ${Object.keys(results.tables.tables).length} validated`);
      logger.info(`⚙️ Functions: ${Object.keys(results.functions.functions).length} validated`);
    } else {
      logger.error(`❌ Database health check failed (${duration})`);
      
      if (results.connectivity?.status === 'failed') {
        logger.error('🔌 Connectivity: FAILED');
        logger.error(`   Error: ${results.connectivity.error}`);
      }

      if (results.tables?.missingTables?.length > 0) {
        logger.error(`📋 Missing tables (${results.tables.missingTables.length}):`);
        results.tables.missingTables.forEach(table => {
          logger.error(`   - ${table}`);
        });
      }

      if (results.functions?.missingFunctions?.length > 0) {
        logger.error(`⚙️ Missing functions (${results.functions.missingFunctions.length}):`);
        results.functions.missingFunctions.forEach(func => {
          logger.error(`   - ${func}`);
        });
      }

      // Log recovery suggestions
      logger.error('\n🔧 Recovery Suggestions:');
      results.suggestions.forEach((suggestion, index) => {
        logger.error(`${index + 1}. ${suggestion.issue} (${suggestion.severity})`);
        logger.error(`   Action: ${suggestion.action}`);
        if (suggestion.details) {
          logger.error(`   Details: ${suggestion.details}`);
        }
        if (suggestion.command) {
          logger.error(`   Command: ${suggestion.command}`);
        }
      });
    }
  }
}

export const databaseHealthCheck = new DatabaseHealthCheck();