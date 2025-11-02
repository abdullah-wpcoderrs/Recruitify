/**
 * Secure logging utility that prevents sensitive data exposure
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  formId?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};
    
    // Only include safe, non-sensitive fields
    const allowedFields = ['userId', 'formId', 'action', 'timestamp', 'userAgent'];
    
    for (const [key, value] of Object.entries(context)) {
      if (allowedFields.includes(key)) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && this.isClient) {
      // In production on client-side, only log errors
      if (level !== 'error') return;
    }

    const sanitizedContext = context ? this.sanitizeContext(context) : {};
    const timestamp = new Date().toISOString();
    
    const logData = {
      timestamp,
      level,
      message,
      ...sanitizedContext
    };

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR: ${message}`, sanitizedContext);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN: ${message}`, sanitizedContext);
        break;
      case 'info':
        console.info(`[${timestamp}] INFO: ${message}`, sanitizedContext);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(`[${timestamp}] DEBUG: ${message}`, sanitizedContext);
        }
        break;
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  // Specific methods for common use cases
  formCreated(formId: string, userId: string) {
    this.info('Form created successfully', { formId, userId, action: 'form_create' });
  }

  formSubmission(formId: string, success: boolean) {
    this.info('Form submission processed', { formId, success, action: 'form_submit' });
  }

  authStateChange(event: string, hasUser: boolean) {
    this.info('Auth state changed', { event, hasUser, action: 'auth_change' });
  }

  analyticsCalculated(formId: string, fieldCount: number) {
    this.debug('Analytics calculated', { formId, fieldCount, action: 'analytics_calc' });
  }
}

export const logger = new Logger();