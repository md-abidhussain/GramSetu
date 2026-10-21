import { logger } from '../utils/logger.js';
import { DEFECT_TYPES } from './ai/responseSchema.js';

/**
 * Client for the Python defect-detection service (segmentation-service/).
 *
 * Status meanings, stored on each complaint:
 *   completed        real model inference ran (defects may be empty: nothing found)
 *   simulated        the service is in opt-in demo mode; output is NOT a detection
 *   model_unavailable the service is up but has no usable model
 *   not_configured   SEGMENTATION_SERVICE_URL is not set
 *   unavailable      the service did not answer, or answered with something unusable
 *
 * Only `completed` defects may influence severity or be described as detected.
 */
export const SEGMENTATION_STATUS = Object.freeze({
  COMPLETED: 'completed',
  SIMULATED: 'simulated',
  MODEL_UNAVAILABLE: 'model_unavailable',
  NOT_CONFIGURED: 'not_configured',
  UNAVAILABLE: 'unavailable'
});

const MAX_SCALE_CM_PER_PIXEL = 10;

const serviceUrl = () => process.env.SEGMENTATION_SERVICE_URL?.replace(/\/$/, '');

/** A scale is optional; when given it must be a plausible positive number. */
export const parseScale = (value) => {
  if (value === undefined || value === null || value === '') return { ok: true, scale: null };
  const scale = Number(value);
  if (!Number.isFinite(scale) || scale <= 0 || scale > MAX_SCALE_CM_PER_PIXEL) {
    return { ok: false, message: `Scale must be a number above 0 and at most ${MAX_SCALE_CM_PER_PIXEL} cm per pixel.` };
  }
  return { ok: true, scale };
};

const finite = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

// Anything the service returns is checked before it is stored.
const cleanDefect = (raw, simulated) => {
  if (!raw || typeof raw !== 'object') return null;
  const type = typeof raw.type === 'string' ? raw.type.toLowerCase().replace(/[\s-]+/g, '_') : null;
  const normalizedType = type === 'openmanhole' ? 'open_manhole' : type;
  if (!normalizedType || !DEFECT_TYPES.includes(normalizedType)) return null;

  const confidence = finite(raw.confidence);
  if (!simulated && (confidence === undefined || confidence < 0 || confidence > 1)) return null;

  const box = raw.boundingBoxPixels || {};
  return {
    type: normalizedType,
    confidence: simulated ? null : confidence,
    simulated,
    measurementBasis: raw.measurementBasis === 'mask' ? 'mask' : 'bounding_box',
    areaPixels: finite(raw.areaPixels),
    areaFractionOfImage: finite(raw.areaFractionOfImage),
    areaCm2: finite(raw.areaCm2) ?? null,
    widthCm: finite(raw.widthCm) ?? null,
    heightCm: finite(raw.heightCm) ?? null,
    boundingBoxPixels: { x: finite(box.x), y: finite(box.y), width: finite(box.width), height: finite(box.height) },
    depth: null
  };
};

const outcome = (status, message, extra = {}) => ({ status, message, defects: [], ...extra });

/**
 * @param {{buffer: Buffer, mimetype: string, originalname?: string}} file
 * @param {number|null} scaleCmPerPixel measured scale, or null when nobody measured one
 */
export const detectDefects = async (file, scaleCmPerPixel = null) => {
  const baseUrl = serviceUrl();
  if (!baseUrl) {
    return outcome(SEGMENTATION_STATUS.NOT_CONFIGURED, 'Automated defect detection is not running on this deployment.');
  }

  const form = new FormData();
  form.append('image', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'photo.jpg');
  if (scaleCmPerPixel) form.append('scale_cm_per_pixel', String(scaleCmPerPixel));
  if (process.env.SEGMENTATION_MIN_CONFIDENCE) form.append('confidence', process.env.SEGMENTATION_MIN_CONFIDENCE);

  const headers = {};
  if (process.env.SEGMENTATION_SERVICE_TOKEN) headers['X-Service-Token'] = process.env.SEGMENTATION_SERVICE_TOKEN;

  let response;
  let body;
  try {
    response = await fetch(`${baseUrl}/segment`, {
      method: 'POST',
      body: form,
      headers,
      signal: AbortSignal.timeout(Number(process.env.SEGMENTATION_TIMEOUT_MS) || 30_000)
    });
    body = await response.json().catch(() => null);
  } catch (error) {
    logger.warn('defect detection service unreachable', { reason: error.name === 'TimeoutError' ? 'timeout' : 'network' });
    return outcome(SEGMENTATION_STATUS.UNAVAILABLE, 'The defect detection service did not respond.');
  }

  if (response.status === 503 && body?.inferenceMode === 'model_unavailable') {
    return outcome(SEGMENTATION_STATUS.MODEL_UNAVAILABLE, 'The defect detection model is not loaded, so no detection was made.');
  }
  if (!response.ok || !body || typeof body !== 'object') {
    logger.warn('defect detection service error', { httpStatus: response.status });
    return outcome(SEGMENTATION_STATUS.UNAVAILABLE, 'The defect detection service returned an error.');
  }

  const simulated = body.inferenceMode === 'demo_simulation';
  if (!simulated && body.inferenceMode !== 'real_inference') {
    // An answer that does not say how it was produced is not trusted.
    return outcome(SEGMENTATION_STATUS.UNAVAILABLE, 'The defect detection service did not say whether it ran a real model.');
  }

  const defects = (Array.isArray(body.defects) ? body.defects : [])
    .map((raw) => cleanDefect(raw, simulated))
    .filter(Boolean);

  return {
    status: simulated ? SEGMENTATION_STATUS.SIMULATED : SEGMENTATION_STATUS.COMPLETED,
    message: simulated
      ? 'DEMO SIMULATION: the defect shown is a placeholder, not a detection.'
      : defects.length === 0 ? 'The model found no defects in this photo.' : undefined,
    modelTask: typeof body.modelTask === 'string' ? body.modelTask : undefined,
    scaleCmPerPixel: scaleCmPerPixel ?? null,
    defects
  };
};

/** Only real detections count. Simulated or missing output never does. */
export const realDefects = (segmentation) =>
  segmentation?.status === SEGMENTATION_STATUS.COMPLETED ? segmentation.defects || [] : [];
