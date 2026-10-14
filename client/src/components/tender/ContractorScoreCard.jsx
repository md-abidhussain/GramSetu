import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Award, CalendarCheck, Clock, TrendingUp } from 'lucide-react';

export const ContractorScoreCard = ({ contractor }) => {
  if (!contractor) return null;

  const {
    name,
    registrationId,
    performanceScore = 100,
    completedOnTime = 0,
    delayedCount = 0,
    averageBudgetVariance = 0,
  } = contractor;

  // Determine score colors
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const getProgressBarColor = (score) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    return 'bg-rose-500';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <span className="text-xs text-slate-600 font-bold">Contractor Performance Ledger</span>
          <CardTitle className="text-lg mt-0.5">{name}</CardTitle>
          <span className="text-xs text-slate-600">ID: {registrationId}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Large Score Indicator */}
        <div className="flex items-center gap-5 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100/80">
          <div className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center border font-bold ${getScoreColor(performanceScore)}`}>
            <span className="text-2xl tracking-tighter leading-none">{performanceScore}</span>
            <span className="text-xs font-semibold opacity-85">Pts</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs font-semibold text-dark-800 mb-1.5">
              <span>Risk Standing Score</span>
              <span>{performanceScore >= 90 ? 'Excellent' : performanceScore >= 70 ? 'Satisfactory' : 'Critical Risk'}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(performanceScore)}`}
                style={{ width: `${performanceScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
            <CalendarCheck className="h-4.5 w-4.5 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-base font-bold text-dark-800 leading-none">{completedOnTime}</p>
            <p className="text-xs text-slate-600 uppercase font-semibold mt-1">On Time</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
            <Clock className="h-4.5 w-4.5 text-amber-500 mx-auto mb-1.5" />
            <p className="text-base font-bold text-dark-800 leading-none">{delayedCount}</p>
            <p className="text-xs text-slate-600 uppercase font-semibold mt-1">Delayed</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
            <TrendingUp className="h-4.5 w-4.5 text-blue-500 mx-auto mb-1.5" />
            <p className="text-base font-bold text-dark-800 leading-none">
              {averageBudgetVariance > 0 ? `+${averageBudgetVariance}%` : `${averageBudgetVariance}%`}
            </p>
            <p className="text-xs text-slate-600 uppercase font-semibold mt-1">Budget Var.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorScoreCard;
