import React from 'react';
import { Card } from '../ui/Card.jsx';
import { Activity, ShieldCheck, AlertCircle, FileSpreadsheet, TrendingUp, MessageSquare } from 'lucide-react';

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
      iconColor: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Physical Completions',
      value: completedProjects,
      desc: 'Completed construction works',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Audit Compliance Avg',
      value: `${averageCompletionScore}%`,
      desc: 'Compliance index',
      icon: TrendingUp,
      iconColor: 'text-slate-700 bg-slate-50 border-slate-200',
    },
    {
      title: 'Flagged Anomalies',
      value: flaggedProjects,
      desc: 'Critical deviations detected',
      icon: AlertCircle,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Active Tenders',
      value: activeTendersCount,
      desc: 'Tenders in review',
      icon: FileSpreadsheet,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Citizen Complaints',
      value: totalComplaints,
      desc: 'Damage reports registered',
      icon: MessageSquare,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-100',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-white border border-slate-200">
            <div className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{card.title}</span>
                <span className="text-2xl font-extrabold text-dark-800 tracking-tight block">{card.value}</span>
                <span className="text-xs text-slate-500 font-medium block">{card.desc}</span>
              </div>
              <div className={`p-2.5 rounded-md border shrink-0 ${card.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AnalyticsCharts;
