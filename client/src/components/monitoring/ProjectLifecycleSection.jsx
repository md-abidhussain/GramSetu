import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { getProjectLifecycle, updateProjectLifecycle } from '../../services/monitoringService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { FileText, Hammer, Bot, Users, ClipboardCheck, BadgeCheck, XCircle, Wrench, Clock3 } from 'lucide-react';

const steps = [
  { key: 'Tender Published', label: 'Tender', icon: FileText },
  { key: 'Project Created', label: 'Created', icon: Hammer },
  { key: 'Construction Started', label: 'Construction', icon: Hammer },
  { key: 'Waiting for AI Verification', label: 'AI', icon: Bot },
  { key: 'AI Verified', label: 'Citizen', icon: Users },
  { key: 'Citizen Verification', label: 'Review', icon: ClipboardCheck },
  { key: 'Under Authority Review', label: 'Approved', icon: BadgeCheck },
  { key: 'Approved', label: 'Approved', icon: BadgeCheck }
];

const getStepState = (current, stepKey) => {
  const order = [
    'Tender Published',
    'Project Created',
    'Construction Started',
    'Waiting for AI Verification',
    'AI Verified',
    'Citizen Verification',
    'Under Authority Review',
    'Approved'
  ];

  const currentIndex = order.indexOf(current);
  const stepIndex = order.indexOf(stepKey);

  if (current === 'Rejected') {
    return 'rejected';
  }
  if (current === 'Maintenance Required') {
    return 'maintenance';
  }
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'future';
};

const statusBadgeClasses = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  current: 'bg-brand-50 text-brand-700 border-brand-100',
  future: 'bg-slate-100 text-slate-500 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-100'
};

export const ProjectLifecycleSection = ({ projectId, project }) => {
  const [history, setHistory] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(project?.lifecycleStatus || 'Tender Published');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const loadLifecycle = async () => {
      if (!projectId) return;
      try {
        const data = await getProjectLifecycle(projectId);
        setHistory(data.history || []);
        setCurrentStatus(data.currentStatus || project?.lifecycleStatus || 'Tender Published');
      } catch (error) {
        console.error('Failed to load lifecycle', error);
      }
    };
    loadLifecycle();
  }, [projectId, project?.lifecycleStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) return;
    setLoading(true);
    try {
      const updated = await updateProjectLifecycle(projectId, { status, remarks });
      setCurrentStatus(updated.lifecycleStatus || status);
      const data = await getProjectLifecycle(projectId);
      setHistory(data.history || []);
      setMessage('Lifecycle updated successfully.');
      setStatus('');
      setRemarks('');
    } catch (error) {
      setMessage(error.message || 'Unable to update lifecycle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-4.5 w-4.5 text-brand-600" /> Project Lifecycle
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Operational progression and authority updates</p>
          </div>
          {user?.role !== 'citizen' && (
            <Button variant="secondary" onClick={() => setMessage('')} className="text-xs px-3 py-2">
              Update Status
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Current: {currentStatus}
          </span>
          {project?.completionScore !== undefined && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Score: {project.completionScore}%
            </span>
          )}
          {project?.riskLevel && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Risk: {project.riskLevel}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const state = getStepState(currentStatus, step.key);
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${statusBadgeClasses[state]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className={`flex-1 rounded-xl border px-3 py-2 text-sm ${statusBadgeClasses[state]}`}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {user?.role !== 'citizen' && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
            {message && <p className="text-xs text-slate-500">{message}</p>}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">Select next status</option>
              <option value="Construction Started">Construction Started</option>
              <option value="Waiting for AI Verification">Waiting for AI Verification</option>
              <option value="AI Verified">AI Verified</option>
              <option value="Citizen Verification">Citizen Verification</option>
              <option value="Under Authority Review">Under Authority Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Maintenance Required">Maintenance Required</option>
            </select>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Remarks"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <Button type="submit" loading={loading} className="w-full">Submit</Button>
          </form>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Timeline</h4>
          <div className="mt-3 space-y-3">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">No lifecycle activity yet.</p>
            ) : history.map((entry, idx) => (
              <div key={`${entry.status}-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-dark-800">{entry.status}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">{entry.updatedBy}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{entry.remarks || 'No remarks provided.'}</p>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectLifecycleSection;
