import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { AlertCircle, CheckCircle2, ShieldAlert, MessageSquare } from 'lucide-react';

export const DiscrepancyReport = ({ result }) => {
  if (!result) return null;

  const {
    detectedIssues = [],
    matchScore = 100,
    flaggedAsDiscrepancy = false,
    aiReport = '',
  } = result;

  const getMatchScoreStyle = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 55) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const getIssueLabel = (issue) => {
    // Map code to user-friendly label
    const labels = {
      crack: 'Cracks Detected',
      road_damage: 'Road Structural Damage',
      leakage: 'Fluid/Water Leakage',
      broken_infrastructure: 'Broken Infrastructure',
      garbage: 'Garbage & Debris Accumulation',
      none: 'No issues found'
    };
    return labels[issue] || issue;
  };

  return (
    <Card className="border-t-4 border-t-brand-650">
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <div>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">Verification Ledger</span>
            <CardTitle className="text-lg mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-brand-600" /> Compliance Report
            </CardTitle>
          </div>
          
          {flaggedAsDiscrepancy ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded border border-red-200">
              <ShieldAlert className="h-3.5 w-3.5" /> Discrepancy Flagged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Consistent
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Match Score Indicator */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
          <div className={`h-14 w-14 rounded-md border font-bold flex flex-col items-center justify-center ${getMatchScoreStyle(matchScore)}`}>
            <span className="text-xl tracking-tight leading-none">{matchScore}%</span>
            <span className="text-[8px] uppercase tracking-wider font-semibold opacity-85 mt-0.5">Match</span>
          </div>
          <div>
            <p className="text-xs font-bold text-dark-800">Verification Score</p>
            <p className="text-[11px] text-slate-550 leading-normal mt-0.5">
              {matchScore >= 80 
                ? 'Current photo aligns well with official completion records.' 
                : 'Current photo shows clear structural inconsistencies compared to completion records.'}
            </p>
          </div>
        </div>

        {/* Detected Issues */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detected Anomalies</span>
          <div className="flex flex-wrap gap-1.5">
            {detectedIssues.length === 0 || (detectedIssues.length === 1 && detectedIssues[0] === 'none') ? (
              <span className="inline-flex text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
                No major issues visible
              </span>
            ) : (
              detectedIssues.map((issue) => (
                <span
                  key={issue}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-md font-medium"
                >
                  <AlertCircle className="h-3 w-3" />
                  {getIssueLabel(issue)}
                </span>
              ))
            )}
          </div>
        </div>

        {/* report narrative */}
        <div className="border-t border-slate-200 pt-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-slate-400" /> Executive Compliance Report
          </span>
          <p className="text-xs text-dark-800 leading-relaxed bg-brand-50/10 p-4 rounded-md border border-brand-100/30">
            {aiReport}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscrepancyReport;
