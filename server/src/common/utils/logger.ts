type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  meta?: Record<string, unknown>;
  error?: unknown;
}

function formatLog(payload: LogPayload): string {
  if (process.env.NODE_ENV === 'test') {
    return '';
  }
  return JSON.stringify(payload);
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>, context?: string) {
    const log = formatLog({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
      meta,
    });
    if (log) console.log(log);
  },
  warn(message: string, meta?: Record<string, unknown>, context?: string) {
    const log = formatLog({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
      meta,
    });
    if (log) console.warn(log);
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>, context?: string) {
    const log = formatLog({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      meta,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    if (log) console.error(log);
  },
  debug(message: string, meta?: Record<string, unknown>, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        context,
        meta,
      });
      if (log) console.debug(log);
    }
  },
};
