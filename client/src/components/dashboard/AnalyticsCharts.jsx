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
      desc: 'Being tracked right now',
      icon: Activity,
      iconColor: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Completed',
      value: completedProjects,
      desc: 'Projects finished and signed off',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Average progress',
      value: `${averageCompletionScore}%`,
      desc: 'Across projects still running',
      icon: TrendingUp,
      iconColor: 'text-slate-700 bg-slate-50 border-slate-200',
    },
    {
      title: 'Flagged',
      value: flaggedProjects,
      desc: 'Projects needing a look',
      icon: AlertCircle,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Active Tenders',
      value: activeTendersCount,
      desc: 'Open for review',
      icon: FileSpreadsheet,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Reports from the public',
      value: totalComplaints,
      desc: 'Filed by members of the public',
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
                <span className="block text-sm font-medium text-slate-600">{card.title}</span>
                <span className="block text-3xl font-semibold tracking-tight text-slate-900">{card.value}</span>
                <span className="block text-sm text-slate-600">{card.desc}</span>
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
