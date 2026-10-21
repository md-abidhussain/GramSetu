import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { ShieldCheck } from 'lucide-react';
import { AiStatusNote } from '../ui/AiStatusNote.jsx';
import { hasAiResult } from '../../lib/aiStatus.js';

export const CompletionScoreCard = ({ score, status = 'Pending', assessment, isSampleData = false }) => {
  // No real comparison means no score: show why, never a number.
  if (typeof score !== 'number' || !hasAiResult(assessment)) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div>
            <span className="text-xs text-slate-600 font-bold">AI before/after comparison</span>
            <CardTitle className="text-base mt-0.5">Completion score</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Not scored</p>
          <AiStatusNote assessment={assessment ?? { status: undefined }} />
          {!assessment && <p className="text-xs text-slate-600">A score appears after the completion photo is uploaded and compared.</p>}
        </CardContent>
      </Card>
    );
  }

  const getCircleColor = (val) => {
    if (val >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (val >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getBgColor = (val) => {
    if (val >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (val >= 50) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  // SVG circle math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div>
          <span className="text-xs text-slate-600 font-bold">{isSampleData ? 'Sample data (not AI)' : 'AI before/after comparison'}</span>
          <CardTitle className="text-base mt-0.5">Completion score</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center flex-1 pb-8">
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 transform -rotate-90" aria-hidden="true">
            {/* Track Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Fill Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className={`transition-all duration-1000 ease-out ${getCircleColor(score)}`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          {/* Central score display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-dark-800 leading-none">{score}</span>
            <span className="text-xs uppercase font-bold text-slate-600 tracking-wider mt-0.5">Score</span>
          </div>
        </div>

        <div className="mt-5 w-full text-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getBgColor(score)}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Status: {status}</span>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-600">An AI estimate from two photos, not an engineering inspection.</p>
      </CardContent>
    </Card>
  );
};

export default CompletionScoreCard;
