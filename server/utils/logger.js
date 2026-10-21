import { randomUUID } from 'node:crypto';

// One JSON object per line, so a log platform (Render, Datadog, etc.) can
// filter by field. Request bodies, cookies and auth headers are never logged:
// they carry passwords, tokens and the contents of citizens' complaints.

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|api[_-]?key|uri/i;

export const redact = (value, depth = 0) => {
  if (value === null || typeof value !== 'object' || depth > 4) return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, code: value.code, status: value.status };
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? '[redacted]' : redact(item, depth + 1)])
  );
};

const write = (level, message, fields = {}) => {
  if (process.env.NODE_ENV === 'test' && process.env.LOG_IN_TESTS !== 'true') return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...redact(fields) });
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
};

export const logger = {
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields)
};

export const requestLogger = (req, res, next) => {
  const started = process.hrtime.bigint();
  req.id = req.get('x-request-id')?.slice(0, 64) || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  res.on('finish', () => {
    logger.info('request', {
      requestId: req.id,
      method: req.method,
      path: req.baseUrl + (req.route?.path ?? req.path),
      status: res.statusCode,
      durationMs: Number((process.hrtime.bigint() - started) / 1_000_000n)
    });
  });
  next();
};
