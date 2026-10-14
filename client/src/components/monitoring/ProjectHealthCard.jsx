import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { HeartPulse, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';

export const ProjectHealthCard = ({ health = 'Healthy', notes = '' }) => {
  const getHealthStyle = (val) => {
    switch (val) {
      case 'Healthy':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
          title: 'Project is Healthy'
        };
      case 'At Risk':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
          title: 'Project is At Risk'
        };
      case 'Failed':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-100',
          icon: <XCircle className="h-5 w-5 text-rose-500 shrink-0" />,
          title: 'Project Failed Audit'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-100',
          icon: <HeartPulse className="h-5 w-5 text-slate-500 shrink-0" />,
          title: 'Awaiting Verification'
        };
    }
  };

  const current = getHealthStyle(health);

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <span className="text-xs text-slate-600 font-bold">Audit Evaluation</span>
          <CardTitle className="text-base mt-0.5">Integrity & Health</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health status banner */}
        <div className={`p-4 rounded-md border flex items-center gap-3 font-medium text-sm ${current.bg}`}>
          {current.icon}
          <span>{current.title}</span>
        </div>

        {/* Audit Notes */}
        <div>
          <span className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-600" /> Audit Assessment Log
          </span>
          <div className="bg-white p-4 rounded-md border border-slate-200 text-xs text-dark-800 leading-relaxed max-h-40 overflow-y-auto">
            {notes || 'No audit assessment recorded. Please upload a completion photo to execute verification comparison.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHealthCard;
