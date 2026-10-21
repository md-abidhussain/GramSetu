import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../utils/logger.js';

/**
 * Every AI call returns one of these statuses. Only `completed` carries data.
 * The rule this file exists to enforce: when the AI did not answer, or answered
 * with something unusable, the caller gets NO scores. It never receives
 * placeholder numbers that look like an assessment.
 */
export const AI_STATUS = Object.freeze({
  COMPLETED: 'completed',
  NOT_CONFIGURED: 'not_configured',
  UNAVAILABLE: 'unavailable',
  INVALID_RESPONSE: 'invalid_response'
});

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const geminiModelName = () => process.env.GEMINI_MODEL || DEFAULT_MODEL;

let testTransport = null;

/** Tests replace the network call with a function returning text or throwing. */
export const __setGeminiTransportForTests = (fn) => {
  testTransport = fn;
};

const realTransport = async ({ model, parts, timeoutMs }) => {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const generativeModel = client.getGenerativeModel(
    { model, generationConfig: { responseMimeType: 'application/json', temperature: 0 } },
    { timeout: timeoutMs }
  );
  const result = await generativeModel.generateContent(parts);
  return result.response.text();
};

const withTimeout = (promise, timeoutMs) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('AI provider timed out');
      error.code = 'AI_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Retrying a bad API key or a rejected request just repeats the failure and
// the bill. Only transient problems are retried.
export const isRetryable = (error) => {
  if (error?.code === 'AI_TIMEOUT') return true;
  const status = error?.status ?? error?.statusCode;
  if (status === 429 || (status >= 500 && status <= 599)) return true;
  if (status) return false;
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(error?.message || '');
};

export const describeFailure = (error) => {
  if (error?.code === 'AI_TIMEOUT') return 'timeout';
  const status = error?.status ?? error?.statusCode;
  if (status === 429) return 'rate_limited';
  if (status === 401 || status === 403) return 'not_authorized';
  if (status === 404) return 'model_not_found';
  if (status >= 500) return 'provider_error';
  if (status) return 'request_rejected';
  return 'network_error';
};

export const stripCodeFence = (text) => {
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a prompt (plus optional image parts) and validates the JSON reply.
 *
 * @param {object} options
 * @param {string} options.prompt
 * @param {Array} [options.parts] inlineData parts placed before the prompt
 * @param {(raw: unknown) => {ok: boolean, value?: object, problems?: string[]}} options.validate
 * @returns {Promise<{status: string, data?: object, model?: string, reason?: string}>}
 */
export const generateJson = async ({ prompt, parts = [], validate, timeoutMs = 25_000, retries = 2 }) => {
  if (!testTransport && !process.env.GEMINI_API_KEY) {
    return { status: AI_STATUS.NOT_CONFIGURED, reason: 'GEMINI_API_KEY is not set' };
  }

  const send = testTransport || realTransport;
  const model = geminiModelName();
  const baseDelay = Number(process.env.AI_RETRY_BASE_MS ?? 600);
  let lastFailure = { status: AI_STATUS.UNAVAILABLE, reason: 'no_attempt' };

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) {
      // Exponential backoff with jitter, bounded by the retry count.
      await sleep(baseDelay * 2 ** (attempt - 1) + Math.random() * baseDelay);
    }

    let text;
    try {
      text = await withTimeout(Promise.resolve(send({ model, parts: [...parts, prompt], timeoutMs })), timeoutMs);
    } catch (error) {
      const reason = describeFailure(error);
      logger.warn('AI call failed', { attempt: attempt + 1, reason, providerStatus: error?.status });
      lastFailure = { status: AI_STATUS.UNAVAILABLE, reason };
      if (!isRetryable(error)) break;
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(stripCodeFence(text ?? ''));
    } catch {
      logger.warn('AI returned malformed JSON', { attempt: attempt + 1 });
      lastFailure = { status: AI_STATUS.INVALID_RESPONSE, reason: 'malformed_json' };
      continue;
    }

    const checked = validate(parsed);
    if (!checked.ok) {
      logger.warn('AI response failed validation', { attempt: attempt + 1, problems: checked.problems });
      lastFailure = { status: AI_STATUS.INVALID_RESPONSE, reason: `schema: ${checked.problems.join('; ')}` };
      continue;
    }

    return { status: AI_STATUS.COMPLETED, data: checked.value, model };
  }

  return lastFailure;
};
