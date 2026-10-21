import React from 'react';
import { Info } from 'lucide-react';
import { describeAiStatus } from '../../lib/aiStatus.js';

const TONES = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  muted: 'border-slate-200 bg-slate-50 text-slate-700',
  neutral: 'border-slate-200 bg-white text-slate-700'
};

/** Explains why an AI value is missing or not real. Renders nothing for a genuine result. */
export const AiStatusNote = ({ assessment, className = '' }) => {
  const description = describeAiStatus(assessment);
  if (!description.text) return null;
  return (
    <p role="note" className={`flex items-start gap-1.5 rounded-md border p-2.5 text-xs ${TONES[description.tone]} ${className}`}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span><strong className="font-semibold">{description.label}.</strong> {description.text}</span>
    </p>
  );
};

export const SampleDataBadge = ({ record }) =>
  record?.dataSource === 'sample' ? (
    <span className="inline-flex items-center rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">
      Sample data
    </span>
  ) : null;

export default AiStatusNote;
