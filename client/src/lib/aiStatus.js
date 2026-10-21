// How to describe where an AI-looking value came from. Used everywhere a
// score or finding is shown, so "the AI did not run" is never displayed as a result.

const DESCRIPTIONS = {
  completed: { label: 'AI analysis', tone: 'neutral', text: null },
  sample_data: { label: 'Sample data', tone: 'info', text: 'Sample record written by hand for the demo. This is not an AI result.' },
  not_configured: { label: 'AI not set up', tone: 'muted', text: 'AI analysis is not set up on this server, so this was not assessed.' },
  unavailable: { label: 'AI did not run', tone: 'warning', text: 'The AI service could not be reached, so no AI assessment was made.' },
  invalid_response: { label: 'AI answer rejected', tone: 'warning', text: 'The AI gave an answer that failed validation, so it was not used.' }
};

export const describeAiStatus = (assessment) => {
  if (!assessment?.status) return { status: 'none', label: 'Not assessed', tone: 'muted', text: 'No AI assessment is recorded.' };
  return { status: assessment.status, ...(DESCRIPTIONS[assessment.status] || DESCRIPTIONS.unavailable) };
};

/** True only for a real AI result whose numbers may be shown. */
export const hasAiResult = (assessment) => assessment?.status === 'completed' || assessment?.status === 'sample_data';

export const isSample = (record) => record?.dataSource === 'sample';

export const DEFECT_LABELS = {
  pothole: 'Pothole',
  crack: 'Crack',
  road_damage: 'Road damage',
  open_manhole: 'Open manhole',
  leakage: 'Leakage',
  broken_infrastructure: 'Broken infrastructure',
  garbage: 'Garbage or debris'
};

export const defectLabel = (type) => DEFECT_LABELS[type] || String(type || '').replaceAll('_', ' ');

export const DETECTION_STATUS_TEXT = {
  completed: null,
  simulated: 'DEMO SIMULATION: the defect detection service is in demo mode. The box shown is a placeholder, not a detection.',
  model_unavailable: 'The defect detection model was not loaded, so no automated detection was made.',
  not_configured: 'Automated defect detection is not running on this deployment.',
  unavailable: 'The defect detection service did not respond, so no automated detection was made.',
  scale_missing: 'Defect detection did not run for this older report.',
  pending: 'Defect detection has not run.'
};
