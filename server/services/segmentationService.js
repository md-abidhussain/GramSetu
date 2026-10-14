const serviceUrl = () => process.env.SEGMENTATION_SERVICE_URL?.replace(/\/$/, '');

/**
 * Measures road defects by sending the photo to the YOLOv8 segmentation
 * service, which returns an area and size per defect.
 *
 * That service runs separately and is not deployed alongside the rest of the
 * app, so this returns what happened instead of throwing. A complaint is still
 * worth filing without measurements, and the report says they are missing
 * rather than inventing numbers.
 */
export const quantifyDefects = async (file, scaleCmPerPixel) => {
  const baseUrl = serviceUrl();
  const scale = Number(scaleCmPerPixel);

  if (!baseUrl) {
    return {
      status: 'unavailable',
      defects: [],
      message: 'Automated defect measurement is not running. Everything else in this report is unaffected.'
    };
  }

  if (!Number.isFinite(scale) || scale <= 0) {
    return {
      status: 'scale_missing',
      defects: [],
      message: 'Defect sizes need a calibrated reference scale, which was not supplied with this photo.'
    };
  }

  const form = new FormData();
  form.append('image', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'report.jpg');
  form.append('scale_cm_per_pixel', String(scale));
  if (process.env.SEGMENTATION_MIN_CONFIDENCE) {
    form.append('confidence', process.env.SEGMENTATION_MIN_CONFIDENCE);
  }

  try {
    const response = await fetch(`${baseUrl}/segment`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`the service returned ${response.status}`);
    }

    const body = await response.json();
    return {
      status: 'completed',
      defects: Array.isArray(body.defects) ? body.defects : [],
      message: body.message
    };
  } catch (error) {
    // Logged rather than raised: an official reading the complaint needs to
    // know the measurement is missing, not why the service was down.
    console.warn('Defect measurement unavailable:', error.message);
    return {
      status: 'unavailable',
      defects: [],
      message: 'The defect measurement service did not respond, so sizes are missing from this report.'
    };
  }
};
