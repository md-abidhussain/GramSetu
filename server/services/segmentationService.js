const serviceUrl = () => process.env.SEGMENTATION_SERVICE_URL?.replace(/\/$/, '');

/**
 * Sends an uploaded photo to the local YOLOv8-Seg service. The service uses a
 * road-defect segmentation checkpoint and returns mask-derived measurements.
 * Semantic segmentation is a required stage of citizen verification.
 */
export const quantifyDefects = async (file, scaleCmPerPixel) => {
  const baseUrl = serviceUrl();
  const scale = Number(scaleCmPerPixel);

  if (!baseUrl) {
    throw new Error('AI defect segmentation is not configured. Set SEGMENTATION_SERVICE_URL and start the YOLOv8-Seg service.');
  }
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('A positive calibrated reference scale (cm per pixel) is required for AI defect quantification.');
  }

  const form = new FormData();
  form.append('image', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'report.jpg');
  form.append('scale_cm_per_pixel', String(scale));
  if (process.env.SEGMENTATION_MIN_CONFIDENCE) {
    form.append('confidence', process.env.SEGMENTATION_MIN_CONFIDENCE);
  }

  const timeout = AbortSignal.timeout(30000);
  try {
    const response = await fetch(`${baseUrl}/segment`, { method: 'POST', body: form, signal: timeout });
    if (!response.ok) throw new Error(`Segmentation service returned ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Defect segmentation unavailable:', error.message);
    throw new Error(`AI defect segmentation failed: ${error.message}`);
  }
};
