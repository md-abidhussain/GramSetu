export const runMockLifecycleAI = async (project) => {
  const baseScore = 85 + ((project.title?.length || 0) % 10) * 1;
  const riskLevel = baseScore >= 90 ? 'Low' : baseScore >= 75 ? 'Medium' : 'High';
  const recommendation = riskLevel === 'Low'
    ? 'Construction appears complete. Citizen verification recommended.'
    : riskLevel === 'Medium'
      ? 'Minor discrepancies detected. Authority review recommended before approval.'
      : 'Critical issues detected. Maintenance planning is recommended.';

  return {
    completionScore: Math.min(100, baseScore),
    riskLevel,
    recommendation,
    confidence: 90 + ((project.title?.length || 0) % 6)
  };
};
