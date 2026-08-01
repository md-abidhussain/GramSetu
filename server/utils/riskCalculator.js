/**
 * Calculates risk level based on numerical risk score
 * @param {number} score - Score from 0 to 100
 * @returns {'Low' | 'Medium' | 'High'}
 */
export const calculateRiskLevel = (score) => {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
};
