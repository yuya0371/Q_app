import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: import.meta.env.VITE_ENV === 'production' ? 0.2 : 1.0,

    // Replay configuration (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Filter out development errors
    beforeSend(event) {
      if (import.meta.env.DEV) {
        console.log('Sentry event (dev):', event);
        return null;
      }
      return event;
    },
  });
}

// Helper to capture user info
export function setSentryUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

// Helper to clear user on logout
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Helper to capture custom error
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to capture message
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export { Sentry };
