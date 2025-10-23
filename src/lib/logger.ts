// Secure logging service that prevents sensitive data exposure
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

// Sensitive patterns to filter out from logs
const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // email
  /\b(?:password|token|key|secret|auth|bearer)\b/gi, // sensitive keywords
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI API key pattern
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, // Bearer tokens
];

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private sanitize(input: string): string {
    let sanitized = input;

    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    // Skip all logging in production to keep console clean
    if (!this.isDevelopment) {
      return;
    }

    // Always sanitize the message
    const sanitizedMessage = this.sanitize(message);

    // Sanitize data object if provided
    let sanitizedData: Record<string, any> | undefined;
    if (data) {
      sanitizedData = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (typeof value === 'string') {
          sanitizedData![key] = this.sanitize(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitizedData![key] = this.sanitize(JSON.stringify(value));
        } else {
          sanitizedData![key] = value;
        }
      });
    }

    const logEntry: LogEntry = {
      level,
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
      data: sanitizedData,
    };

    // Log to console in development only
    switch (level) {
      case 'debug':
        console.debug(`[${logEntry.timestamp}] DEBUG:`, logEntry.message, logEntry.data);
        break;
      case 'info':
        // Suppress INFO logs for cleaner console
        break;
      case 'warn':
        console.warn(`[${logEntry.timestamp}] WARN:`, logEntry.message, logEntry.data);
        break;
      case 'error':
        console.error(`[${logEntry.timestamp}] ERROR:`, logEntry.message, logEntry.data);
        break;
    }
  }
  
  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }
  
  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }
  
  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }
  
  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }
  
  // For authentication related operations
  auth(message: string, userId?: string): void {
    this.info(`AUTH: ${message}`, userId ? { userId } : undefined);
  }
  
  // For API operations  
  api(message: string, endpoint?: string, status?: number): void {
    this.info(`API: ${message}`, { endpoint, status });
  }
  
  // For user actions
  user(message: string, userId?: string, action?: string): void {
    this.info(`USER: ${message}`, { userId, action });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for easy importing
export default logger;