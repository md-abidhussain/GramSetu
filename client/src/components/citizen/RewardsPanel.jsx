import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { formatDate } from '../../lib/formatDate.js';
import { Award } from 'lucide-react';

// Badges and points this citizen has earned for verified reports.
export const RewardsPanel = ({ rewards, loading: loadingRewards, user }) => {
  return (
    <div className="space-y-6">
      {/* Badges Display */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-xs font-semibold text-slate-500 mb-3">Earned Civic Badges</h3>
        <div className="flex flex-wrap gap-2.5">
          {user?.badges?.length > 0 ? (
            user.badges.map((badge, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full shadow-sm">
                <Award className="h-3.5 w-3.5" /> {badge}
              </span>
            ))
          ) : (
            <span className="text-slate-500 text-xs italic">No badges earned yet. Submit verified reports to earn badges.</span>
          )}
        </div>
      </div>

      {/* Rewards List */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-xs font-semibold text-slate-500">Historical Reward Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRewards ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-600 mx-auto" />
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              No rewards generated yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="px-6 py-2.5">Reward Detail</th>
                    <th className="px-6 py-2.5">Type</th>
                    <th className="px-6 py-2.5 text-center">Reward Score</th>
                    <th className="px-6 py-2.5 text-right">Date Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rewards.map(rew => (
                    <tr key={rew._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-semibold text-dark-800">
                        {rew.title}
                        <span className="block text-xs text-slate-500 font-normal mt-0.5">{rew.description}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{rew.rewardType}</td>
                      <td className="px-6 py-3 text-center text-emerald-600 font-bold">+{rew.amount}</td>
                      <td className="px-6 py-3 text-right text-slate-400">{formatDate(rew.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsPanel;
