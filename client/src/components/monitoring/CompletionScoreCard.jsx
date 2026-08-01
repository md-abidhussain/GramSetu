import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Percent, ShieldCheck } from 'lucide-react';

export const CompletionScoreCard = ({ score = 0, status = 'Pending' }) => {
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
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Audit Metric</span>
          <CardTitle className="text-base mt-0.5">Physical Completion</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center flex-1 pb-8">
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 transform -rotate-90">
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
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Score</span>
          </div>
        </div>

        <div className="mt-5 w-full text-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getBgColor(score)}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verification: {status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionScoreCard;
