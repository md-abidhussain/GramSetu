import { realDefects } from '../services/segmentationService.js';

const RANK = { Low: 1, Medium: 2, High: 3 };
const higher = (a, b) => (RANK[b] > RANK[a] ? b : a);

// Hazards that can injure someone straight away, whatever their size.
const IMMEDIATE_HAZARDS = new Set(['open_manhole']);

/**
 * A triage hint for officials, not a measurement. It uses only real evidence:
 * a completed AI image review and/or real model detections. With neither, the
 * answer is "Unassessed" rather than a default that looks like a judgement.
 *
 * Area is compared as a fraction of the photo because no physical scale is
 * known: the same pothole fills more of a close-up than of a wide shot, so
 * this is deliberately coarse (three levels).
 *
 * @returns {{ severity: 'Low'|'Medium'|'High'|'Unassessed', basis: string[] }}
 */
export const assessSeverity = ({ ai, segmentation }) => {
  const basis = [];
  let severity = null;

  if (ai?.status === 'completed') {
    basis.push('ai_image_review');
    const issues = ai.detectedIssues || [];
    let level = 'Low';
    if (issues.some((type) => IMMEDIATE_HAZARDS.has(type))) level = 'High';
    else if (issues.length >= 3 || (ai.flaggedAsDiscrepancy && ai.matchScore <= 30)) level = 'High';
    else if (issues.length >= 1 || ai.flaggedAsDiscrepancy) level = 'Medium';
    severity = level;
  }

  if (segmentation?.status === 'completed') {
    basis.push('defect_detection');
    const defects = realDefects(segmentation);
    const largest = Math.max(0, ...defects.map((defect) => defect.areaFractionOfImage || 0));
    let level = 'Low';
    if (defects.some((defect) => IMMEDIATE_HAZARDS.has(defect.type))) level = 'High';
    else if (largest >= 0.15 || defects.length >= 3) level = 'High';
    else if (defects.length >= 1) level = 'Medium';
    severity = severity ? higher(severity, level) : level;
  }

  return { severity: severity ?? 'Unassessed', basis };
};
