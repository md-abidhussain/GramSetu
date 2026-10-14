import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { 
  Award, 
  X, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Calendar,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export const ContractorLeaderboard = ({ contractors = [] }) => {
  // Sort by trustScore descending
  const sortedContractors = [...contractors].sort((a, b) => b.trustScore - a.trustScore);
  const [selectedContractor, setSelectedContractor] = useState(null);

  const getRankBadge = (index) => {
    const badgeColors = [
      'bg-slate-800 text-white',
      'bg-slate-200 text-slate-700',
      'bg-slate-100 text-slate-600'
    ];
    const colorClass = badgeColors[index] || 'bg-slate-50 text-slate-500';
    return <span className={`h-5 w-5 rounded font-bold text-xs flex items-center justify-center shrink-0 ${colorClass}`}>{index + 1}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border border-emerald-100';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border border-blue-100';
    return 'text-rose-700 bg-rose-50 border border-rose-100';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle className="text-base font-semibold">Contractors</CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Ranked by their record on completed work and public reports.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto max-h-[380px]">
        <div className="divide-y divide-slate-100">
          {sortedContractors.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-600">No contractors on record yet.</p>
          ) : (
            sortedContractors.map((item, idx) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setSelectedContractor(item)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50"
              >
                {getRankBadge(idx)}

                {/* The score sits on its own line below the name rather than
                    beside it. Squeezed into the same row it collided with the
                    name on a narrow panel and the labels were clipped. */}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-slate-900">{item.name}</h4>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>{item.completedCount ?? 0} completed</span>
                    <span>
                      {item.citizenComplaintsCount || 0} public{' '}
                      {(item.citizenComplaintsCount || 0) === 1 ? 'report' : 'reports'}
                    </span>
                  </div>

                  <div className="mt-2">
                    <span className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${getScoreColor(item.trustScore)}`}>
                      Trust score {item.trustScore}%
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>

      {/* Contractor Details Modal */}
      {selectedContractor && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-300">Contractor record</span>
                <h3 className="text-base font-bold flex items-center gap-2 mt-0.5">
                  <Award className="h-5 w-5 text-brand-500" /> {selectedContractor.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedContractor(null)}
                className="text-slate-600 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[500px] text-xs">
              
              {/* Profile details */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <span className="text-sm font-medium text-slate-700">Summary</span>
                <p className="text-slate-700 mt-1 leading-relaxed italic">{selectedContractor.aiSummary}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200 text-slate-500">
                  <p><span className="font-semibold text-slate-600">Registration ID:</span> {selectedContractor.registrationId}</p>
                  <p><span className="font-semibold text-slate-600">Registered Since:</span> {new Date(selectedContractor.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-slate-700">Their record</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                  
                  <div className="bg-emerald-50/20 border border-emerald-100 rounded p-3 text-center">
                    <span className="block text-sm font-medium text-slate-600">Trust score</span>
                    <span className="text-2xl font-semibold text-emerald-600 block mt-1">{selectedContractor.trustScore}%</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded p-3 text-center">
                    <span className="block text-sm font-medium text-slate-600">Completed Works</span>
                    <span className="text-2xl font-semibold text-slate-800 block mt-1">{selectedContractor.completedCount}</span>
                  </div>

                  <div className="bg-amber-50/20 border border-amber-100 rounded p-3 text-center">
                    <span className="block text-sm font-medium text-slate-600">Delayed Projects</span>
                    <span className="text-2xl font-semibold text-amber-600 block mt-1">{selectedContractor.delayedCount}</span>
                  </div>

                  <div className="bg-rose-50/20 border border-rose-100 rounded p-3 text-center">
                    <span className="block text-sm font-medium text-slate-600">Budget Overruns</span>
                    <span className="text-2xl font-semibold text-rose-600 block mt-1">{selectedContractor.budgetOverrunsCount}</span>
                  </div>

                  <div className="bg-rose-50/10 border border-rose-100/50 rounded p-3 text-center">
                    <span className="block text-sm font-medium text-slate-600">Citizen Complaints</span>
                    <span className="text-2xl font-semibold text-rose-700 block mt-1">{selectedContractor.citizenComplaintsCount || 0}</span>
                  </div>

                  <div className="bg-amber-50/10 border border-amber-100/50 rounded p-3 text-center">
                    <span className="block text-sm font-medium text-slate-600">Quality Issues Flagged</span>
                    <span className="text-2xl font-semibold text-amber-700 block mt-1">{selectedContractor.qualityIssuesCount || 0}</span>
                  </div>

                </div>
              </div>

              {/* Historical Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded p-4 bg-white shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-brand-600" aria-hidden="true" /> Performance over time
                  </h4>
                  <div className="flex items-end gap-2.5 h-16 pt-3 px-2">
                    {(selectedContractor.performanceTrend || [80, 82, 85, 94]).map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-brand-500 rounded-t" style={{ height: `${val / 1.5}px` }} />
                        <span className="text-xs text-slate-600 mt-1">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-4 bg-white shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Risk over time
                  </h4>
                  <div className="flex items-end gap-2.5 h-16 pt-3 px-2">
                    {(selectedContractor.riskTrend || [20, 18, 15, 8]).map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${val * 1.5}px` }} />
                        <span className="text-xs text-slate-600 mt-1">{val}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Inspection Logs */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Recent inspections
                  </h4>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {selectedContractor.recentInspections && selectedContractor.recentInspections.length > 0 ? (
                    selectedContractor.recentInspections.map((ins, index) => (
                      <div key={index} className="p-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-dark-800 text-xs">{ins.projectTitle}</p>
                          <span className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5">
                          {ins.result}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-600 italic text-xs">
                      No inspections recorded yet.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedContractor(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold shadow hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </Card>
  );
};

export default ContractorLeaderboard;
