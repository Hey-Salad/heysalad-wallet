// utils/logger.ts
// Conditional logging utility - only logs in development mode

const isDevelopment = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' || __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

// For production error tracking, you could integrate with services like Sentry
// export const logError = (error: Error, context?: Record<string, any>) => {
//   if (!isDevelopment) {
//     // Send to error tracking service
//     // Sentry.captureException(error, { extra: context });
//   }
//   logger.error(error, context);
// };
