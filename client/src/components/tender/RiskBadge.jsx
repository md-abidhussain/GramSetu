import React from 'react';

export const RiskBadge = ({ level = 'Low', score }) => {
  const styles = {
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200/50',
    High: 'bg-rose-50 text-rose-700 border-rose-200/50',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${styles[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        level === 'Low' ? 'bg-emerald-500' : level === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
      }`} />
      {level} {score !== undefined && <span className="opacity-80 font-normal">({score})</span>}
    </span>
  );
};

export default RiskBadge;
