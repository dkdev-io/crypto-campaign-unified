/**
 * Structured Logging Framework
 * Provides consistent, level-based logging with production-ready output
 */

class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.logLevel = process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info');
        
        this.levels = {
            error: 0,
            warn: 1, 
            info: 2,
            debug: 3,
            trace: 4
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const base = {
            timestamp,
            level: level.toUpperCase(),
            context: this.context,
            message
        };

        // Add data if provided
        if (Object.keys(data).length > 0) {
            base.data = data;
        }

        return base;
    }

    log(level, message, data = {}) {
        if (!this.shouldLog(level)) return;

        const formatted = this.formatMessage(level, message, data);
        
        if (this.isDevelopment) {
            // Development: pretty print with colors
            const emoji = this.getLevelEmoji(level);
            const color = this.getLevelColor(level);
            
            console.log(
                `${emoji} ${color}[${formatted.level}]${this.resetColor()} ${formatted.context}: ${message}`,
                Object.keys(data).length > 0 ? data : ''
            );
        } else {
            // Production: structured JSON
            console.log(JSON.stringify(formatted));
        }
    }

    getLevelEmoji(level) {
        const emojis = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            debug: '🐛', 
            trace: '🔍'
        };
        return emojis[level] || 'ℹ️';
    }

    getLevelColor(level) {
        const colors = {
            error: '\x1b[31m',  // red
            warn: '\x1b[33m',   // yellow
            info: '\x1b[36m',   // cyan
            debug: '\x1b[35m',  // magenta
            trace: '\x1b[37m'   // white
        };
        return colors[level] || '\x1b[36m';
    }

    resetColor() {
        return '\x1b[0m';
    }

    // Convenience methods
    error(message, data = {}) {
        this.log('error', message, data);
    }

    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    info(message, data = {}) {
        this.log('info', message, data);
    }

    debug(message, data = {}) {
        this.log('debug', message, data);
    }

    trace(message, data = {}) {
        this.log('trace', message, data);
    }

    // Special methods for common use cases
    success(message, data = {}) {
        if (this.isDevelopment) {
            console.log(`✅ [SUCCESS] ${this.context}: ${message}`, Object.keys(data).length > 0 ? data : '');
        } else {
            this.info(`SUCCESS: ${message}`, data);
        }
    }

    failure(message, data = {}) {
        if (this.isDevelopment) {
            console.log(`❌ [FAILURE] ${this.context}: ${message}`, Object.keys(data).length > 0 ? data : '');
        } else {
            this.error(`FAILURE: ${message}`, data);
        }
    }

    progress(message, data = {}) {
        if (this.isDevelopment) {
            console.log(`🚀 [PROGRESS] ${this.context}: ${message}`, Object.keys(data).length > 0 ? data : '');
        } else {
            this.info(`PROGRESS: ${message}`, data);
        }
    }

    // Create child logger with extended context
    child(childContext) {
        return new Logger(`${this.context}:${childContext}`);
    }
}

// Export singleton instance and class
const logger = new Logger();

// Export factory function
const createLogger = (context) => new Logger(context);

export { Logger, logger, createLogger };