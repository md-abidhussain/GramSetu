import React from 'react';
import { Card } from '../ui/Card.jsx';
import { Activity, ShieldCheck, AlertCircle, FileSpreadsheet, TrendingUp, MessageSquare } from 'lucide-react';

export const AnalyticsCharts = ({ summary }) => {
  if (!summary) return null;

  const {
    totalProjects = 0,
    completedProjects = 0,
    averageCompletionScore = null,
    aiAssessedProjects = 0,
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
      iconColor: 'text-brand-800 bg-brand-50 border-brand-200',
    },
    {
      title: 'Completed',
      value: completedProjects,
      desc: 'Projects finished and signed off',
      icon: ShieldCheck,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Average AI completion score',
      value: averageCompletionScore === null ? 'No data' : `${averageCompletionScore}%`,
      desc: averageCompletionScore === null ? 'No project has a real AI comparison yet' : `From ${aiAssessedProjects} AI-compared project${aiAssessedProjects === 1 ? '' : 's'}`,
      icon: TrendingUp,
      iconColor: 'text-dark-800 bg-surface-50 border-surface-200',
    },
    {
      title: 'Flagged',
      value: flaggedProjects,
      desc: 'Projects needing a look',
      icon: AlertCircle,
      iconColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      title: 'Active Tenders',
      value: activeTendersCount,
      desc: 'Open for review',
      icon: FileSpreadsheet,
      iconColor: 'text-accent-700 bg-accent-50 border-accent-200',
    },
    {
      title: 'Reports from the public',
      value: totalComplaints,
      desc: 'Filed by members of the public',
      icon: MessageSquare,
      iconColor: 'text-brand-700 bg-brand-50/60 border-brand-200',
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
