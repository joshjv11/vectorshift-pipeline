const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const formatError = (error) => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack ?? null };
  }
  return { message: String(error), stack: null };
};

export const logDevError = (context, error, extra = {}) => {
  const { message, stack } = formatError(error);

  console.error(`[pipeline:${context}]`, message, extra);
  if (stack) {
    console.error(stack);
  }

  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  fetch(`${API_BASE}/dev/client-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'error',
      context,
      message,
      stack,
      extra,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    // Backend may be down; browser console still has the error.
  });
};

const installDevErrorReporter = () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  window.addEventListener('error', (event) => {
    logDevError('window.error', event.error ?? event.message, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logDevError('unhandledrejection', event.reason ?? 'Unknown promise rejection');
  });

  console.info('[pipeline] Dev error reporter active — browser errors will echo to the terminal.');
};

installDevErrorReporter();
