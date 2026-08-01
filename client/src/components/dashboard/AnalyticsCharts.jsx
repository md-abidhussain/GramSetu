import React from 'react';
import { Card } from '../ui/Card.jsx';
import { Activity, ShieldCheck, AlertCircle, FileSpreadsheet, Sparkles, MessageSquare } from 'lucide-react';

export const AnalyticsCharts = ({ summary }) => {
  if (!summary) return null;

  const {
    totalProjects = 0,
    completedProjects = 0,
    averageCompletionScore = 100,
    flaggedProjects = 0,
    totalComplaints = 0,
    activeTendersCount = 0
  } = summary;

  const cards = [
    {
      title: 'Total Projects',
      value: totalProjects,
      desc: 'Infrastructure assets registered',
      icon: Activity,
      gradient: 'from-blue-500/10 to-indigo-500/5',
      iconColor: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Physical Completions',
      value: completedProjects,
      desc: 'Completed construction works',
      icon: ShieldCheck,
      gradient: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-600 bg-emerald-100',
    },
    {
      title: 'Audit Accuracy Avg',
      value: `${averageCompletionScore}%`,
      desc: 'AI-calculated completion metric',
      icon: Sparkles,
      gradient: 'from-brand-500/10 to-emerald-500/5',
      iconColor: 'text-brand-700 bg-brand-100',
    },
    {
      title: 'Flagged Anomalies',
      value: flaggedProjects,
      desc: 'Critical deviations detected',
      icon: AlertCircle,
      gradient: 'from-rose-500/10 to-red-500/5',
      iconColor: 'text-rose-600 bg-rose-100',
    },
    {
      title: 'Active Tenders',
      value: activeTendersCount,
      desc: 'Tenders in review / ledger',
      icon: FileSpreadsheet,
      gradient: 'from-purple-500/10 to-pink-500/5',
      iconColor: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Citizen Complaints',
      value: totalComplaints,
      desc: 'Damage reports registered',
      icon: MessageSquare,
      gradient: 'from-amber-500/10 to-orange-500/5',
      iconColor: 'text-amber-600 bg-amber-100',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`bg-gradient-to-br ${card.gradient} transition-transform duration-300 hover:-translate-y-1`}>
            <div className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{card.title}</span>
                <span className="text-2xl font-extrabold text-dark-800 tracking-tight block">{card.value}</span>
                <span className="text-xs text-slate-400 font-medium block">{card.desc}</span>
              </div>
              <div className={`p-3 rounded-2xl border border-white/50 shrink-0 ${card.iconColor}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AnalyticsCharts;
