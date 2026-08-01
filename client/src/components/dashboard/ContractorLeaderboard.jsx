import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Trophy, CalendarCheck, Clock, Medal } from 'lucide-react';

export const ContractorLeaderboard = ({ contractors = [] }) => {
  // Sort by performanceScore descending
  const sortedContractors = [...contractors].sort((a, b) => b.performanceScore - a.performanceScore);

  const getRankBadge = (index) => {
    if (index === 0) return <Medal className="h-5 w-5 text-amber-500 shrink-0" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-400 shrink-0" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700 shrink-0" />;
    return <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0">{index + 1}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-1.5">
            <Trophy className="h-5 w-5 text-amber-500" /> Contractor Performance Ledger
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">National leaderboard ranked by integrity and completion standing</p>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto max-h-[380px]">
        <div className="divide-y divide-slate-50">
          {sortedContractors.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No contractors seeded in the ledger.</p>
          ) : (
            sortedContractors.map((item, idx) => (
              <div key={item._id} className="p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors">
                {/* Ranking */}
                {getRankBadge(idx)}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-dark-800 truncate">{item.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                    <span>ID: {item.registrationId}</span>
                    <span className="flex items-center gap-0.5"><CalendarCheck className="h-3 w-3 text-emerald-500" /> {item.completedOnTime}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3 text-amber-500" /> {item.delayedCount}</span>
                  </div>
                </div>

                {/* Score */}
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${getScoreColor(item.performanceScore)}`}>
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
