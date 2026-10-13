import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import RiskBadge from './RiskBadge.jsx';
import { FileText, AlertTriangle, CheckCircle, Calendar, DollarSign, ListTodo } from 'lucide-react';

export const TenderSummaryCard = ({ tender }) => {
  if (!tender) return null;

  const {
    title,
    aiSummary,
    budgetAllocated,
    budgetAnalysis,
    timelineStart,
    timelineEnd,
    timelineAnalysis,
    riskScore,
    riskLevel,
    recommendation,
    fileUrl
  } = tender;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-1 md:flex-row md:items-center justify-between w-full">
          <div>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">Procurement Review</span>
            <CardTitle className="text-xl mt-0.5">{title}</CardTitle>
          </div>
          <div className="mt-2 md:mt-0 flex gap-2 shrink-0">
            <RiskBadge level={riskLevel} score={riskScore} />
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium rounded-md text-slate-700 transition-colors"
              >
                <FileText className="h-3 w-3" /> PDF Source
              </a>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Executive Summary */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Executive Summary</h4>
          <p className="text-sm text-dark-800 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
            {aiSummary}
          </p>
        </div>

        {/* Budget & Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Budget Info */}
          <div className={`p-5 rounded-md border ${
            budgetAnalysis?.flagged
              ? 'bg-rose-50/40 border-rose-100 shadow-sm'
              : 'bg-emerald-50/30 border-emerald-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-slate-400" /> Budget Analysis
              </span>
              {budgetAnalysis?.flagged ? (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Flagged
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Normal
                </span>
              )}
            </div>
            
            <p className="text-sm font-bold text-dark-800 mb-1">
              Allocated: <span className="text-brand-800 font-bold">{budgetAllocated || 'Not specified'}</span>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {budgetAnalysis?.reason}
            </p>
          </div>

          {/* Timeline Info */}
          <div className={`p-5 rounded-md border ${
            timelineAnalysis?.flagged
              ? 'bg-rose-50/40 border-rose-100 shadow-sm'
              : 'bg-emerald-50/30 border-emerald-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" /> Timeline Analysis
              </span>
              {timelineAnalysis?.flagged ? (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Flagged
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Normal
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-dark-800 mb-1">
              Period: <span className="font-normal text-slate-600">
                {timelineStart ? new Date(timelineStart).toLocaleDateString() : 'TBD'} - {timelineEnd ? new Date(timelineEnd).toLocaleDateString() : 'TBD'}
              </span>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {timelineAnalysis?.reason}
            </p>
          </div>
        </div>

        {/* Procurement Recommendations */}
        <div className="border-t border-slate-200 pt-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ListTodo className="h-4 w-4 text-slate-400" /> Recommendations
          </h4>
          <p className="text-sm text-dark-800 leading-relaxed bg-brand-50/10 p-4 rounded-md border border-brand-100/30">
            {recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenderSummaryCard;
