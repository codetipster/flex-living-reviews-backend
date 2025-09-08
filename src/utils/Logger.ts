import { injectable } from 'inversify';

export interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  [key: string]: any;
}

export interface Logger {
  error(message: string, error?: Error, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

@injectable()
export class ConsoleLogger implements Logger {
  error(message: string, error?: Error, context?: LogContext): void {
    const logEntry = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
      context
    };
    console.error(JSON.stringify(logEntry, null, 2));
  }

  warn(message: string, context?: LogContext): void {
    const logEntry = {
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      context
    };
    console.warn(JSON.stringify(logEntry, null, 2));
  }

  info(message: string, context?: LogContext): void {
    const logEntry = {
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      context
    };
    console.info(JSON.stringify(logEntry, null, 2));
  }

  debug(message: string, context?: LogContext): void {
    const logEntry = {
      level: 'DEBUG',
      message,
      timestamp: new Date().toISOString(),
      context
    };
    console.debug(JSON.stringify(logEntry, null, 2));
  }
}