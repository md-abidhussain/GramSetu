import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';

export const ContractorLeaderboard = ({ contractors = [] }) => {
  // Sort by performanceScore descending
  const sortedContractors = [...contractors].sort((a, b) => b.performanceScore - a.performanceScore);

  const getRankBadge = (index) => {
    const badgeColors = [
      'bg-slate-800 text-white',
      'bg-slate-200 text-slate-700',
      'bg-slate-100 text-slate-600'
    ];
    const colorClass = badgeColors[index] || 'bg-slate-50 text-slate-500';
    return <span className={`h-5 w-5 rounded font-bold text-[10px] flex items-center justify-center shrink-0 ${colorClass}`}>{index + 1}</span>;
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
          <CardTitle>
            Contractor Performance Ledger
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">National leaderboard ranked by integrity and completion standing</p>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto max-h-[380px]">
        <div className="divide-y divide-slate-100">
          {sortedContractors.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No contractors seeded in the ledger.</p>
          ) : (
            sortedContractors.map((item, idx) => (
              <div key={item._id} className="p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors">
                {getRankBadge(idx)}

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-dark-800 truncate">{item.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                    <span>ID: {item.registrationId}</span>
                    <span className="flex items-center gap-0.5">On-Time: {item.completedOnTime}</span>
                    <span className="flex items-center gap-0.5">Delayed: {item.delayedCount}</span>
                  </div>
                </div>

                <div className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${getScoreColor(item.performanceScore)}`}>
                  {item.performanceScore} Pts
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorLeaderboard;
