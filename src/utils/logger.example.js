/**
 * Logger Usage Examples
 * Shows how to use the structured logging framework
 */

import { createLogger, logger } from './logger.js';

// Example 1: Using the default logger
function exampleDefaultLogger() {
    logger.info('Application starting up');
    logger.debug('Loading configuration', { env: process.env.NODE_ENV });
    logger.warn('Using fallback configuration', { reason: 'config file not found' });
    logger.error('Database connection failed', { 
        error: 'Connection timeout',
        retryAttempt: 3 
    });
    logger.success('Database connection established');
}

// Example 2: Creating context-specific loggers
function exampleContextLoggers() {
    const dbLogger = createLogger('Database');
    const apiLogger = createLogger('API');
    const authLogger = createLogger('Auth');

    dbLogger.info('Connection pool initialized', { maxConnections: 10 });
    apiLogger.debug('Processing request', { endpoint: '/api/campaigns', method: 'GET' });
    authLogger.warn('Invalid login attempt', { ip: '192.168.1.1', email: 'test@example.com' });
}

// Example 3: Child loggers
function exampleChildLoggers() {
    const campaignLogger = createLogger('Campaign');
    const validationLogger = campaignLogger.child('Validation');
    const storageLogger = campaignLogger.child('Storage');

    validationLogger.debug('Validating campaign data');
    storageLogger.info('Saving campaign to database', { id: 'camp_123' });
}

// Example 4: Progress tracking
function exampleProgressTracking() {
    const processLogger = createLogger('DataMigration');
    
    processLogger.progress('Starting data migration');
    processLogger.progress('Processing batch 1/10', { progress: 10 });
    processLogger.progress('Processing batch 5/10', { progress: 50 });
    processLogger.success('Migration completed', { 
        totalRecords: 1000, 
        duration: '45s' 
    });
}

// Example 5: Error handling with context
function exampleErrorHandling() {
    const serviceLogger = createLogger('PaymentService');
    
    try {
        // Simulate error
        throw new Error('Payment gateway timeout');
    } catch (error) {
        serviceLogger.failure('Payment processing failed', {
            error: error.message,
            stack: error.stack,
            paymentId: 'pay_123',
            amount: 100.00
        });
    }
}

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔧 Logger Framework Examples\n');
    
    console.log('1. Default Logger:');
    exampleDefaultLogger();
    
    console.log('\n2. Context Loggers:');
    exampleContextLoggers();
    
    console.log('\n3. Child Loggers:');
    exampleChildLoggers();
    
    console.log('\n4. Progress Tracking:');
    exampleProgressTracking();
    
    console.log('\n5. Error Handling:');
    exampleErrorHandling();
}

export {
    exampleDefaultLogger,
    exampleContextLoggers,
    exampleChildLoggers,
    exampleProgressTracking,
    exampleErrorHandling
};