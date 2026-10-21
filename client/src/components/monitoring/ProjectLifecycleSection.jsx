import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { AiStatusNote } from '../ui/AiStatusNote.jsx';
import { getProjectLifecycle, retryAiVerification, updateProjectLifecycle } from '../../services/monitoringService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { FileText, Hammer, Bot, Users, ClipboardCheck, BadgeCheck, Clock3, RefreshCw } from 'lucide-react';

const STEPS = [
  { key: 'Tender Published', label: 'Tender published', icon: FileText },
  { key: 'Project Created', label: 'Project created', icon: Hammer },
  { key: 'Construction Started', label: 'Construction started', icon: Hammer },
  { key: 'Waiting for AI Verification', label: 'Completion photo uploaded', icon: Bot },
  { key: 'AI Verified', label: 'AI comparison done', icon: Bot },
  { key: 'Citizen Verification', label: 'Citizen verification', icon: Users },
  { key: 'Under Authority Review', label: 'Authority review', icon: ClipboardCheck },
  { key: 'Approved', label: 'Decision', icon: BadgeCheck }
];
const ORDER = STEPS.map((step) => step.key);
const FINAL = ['Approved', 'Rejected', 'Maintenance Required'];

const stepState = (current, key) => {
  const currentIndex = FINAL.includes(current) ? ORDER.length - 1 : ORDER.indexOf(current);
  const index = ORDER.indexOf(key);
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return current === 'Rejected' ? 'rejected' : current === 'Maintenance Required' ? 'maintenance' : 'current';
  return 'future';
};

const STATE_CLASSES = {
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  current: 'bg-brand-50 text-brand-800 border-brand-300',
  future: 'bg-slate-50 text-slate-600 border-slate-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
  maintenance: 'bg-amber-50 text-amber-900 border-amber-200'
};

export const ProjectLifecycleSection = ({ projectId, project, onProjectUpdated }) => {
  const { user } = useAuth();
  const isOfficial = Boolean(user?.isAuthority);
  const [history, setHistory] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(project?.lifecycleStatus || 'Project Created');
  const [nextStatuses, setNextStatuses] = useState([]);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await getProjectLifecycle(projectId);
      setHistory(data.history || []);
      setCurrentStatus(data.currentStatus);
      setNextStatuses(data.allowedNextStatuses || []);
      setLoadError(null);
    } catch (error) {
      setLoadError(error.message || 'The project history could not be loaded.');
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load, project?.lifecycleStatus]);

  const afterChange = async (updated, text) => {
    setMessage({ tone: 'ok', text });
    setStatus('');
    setRemarks('');
    await load();
    onProjectUpdated?.(updated);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!status || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const updated = await updateProjectLifecycle(projectId, { status, remarks });
      await afterChange(updated, `Moved to "${status}".`);
    } catch (error) {
      setMessage({ tone: 'error', text: error.message || 'The stage could not be changed.' });
      if (error.status === 409) load();
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const updated = await retryAiVerification(projectId);
      await afterChange(
        updated,
        updated.aiAssessment?.status === 'completed' ? 'AI comparison completed.' : 'The AI comparison still could not run. Try again later.'
      );
    } catch (error) {
      setMessage({ tone: 'error', text: error.message || 'The AI comparison could not be started.' });
    } finally {
      setBusy(false);
    }
  };

  const awaitingAi = currentStatus === 'Waiting for AI Verification';

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-4.5 w-4.5 text-brand-600" aria-hidden="true" /> Project stages
          </CardTitle>
          <p className="mt-0.5 text-xs text-slate-600">Where this project is, and who moved it there.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{loadError}</p>}

        <ol className="flex flex-col gap-2" aria-label="Project stages">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const state = stepState(currentStatus, step.key);
            const label = step.key === 'Approved' && FINAL.includes(currentStatus) ? `Decision: ${currentStatus}` : step.label;
            return (
              <li key={step.key} className="flex items-center gap-3" aria-current={state === 'current' ? 'step' : undefined}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${STATE_CLASSES[state]}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className={`flex-1 rounded-md border px-3 py-2 text-sm ${STATE_CLASSES[state]}`}>
                  {label}
                  <span className="sr-only"> ({state})</span>
                </div>
              </li>
            );
          })}
        </ol>

        {awaitingAi && (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <AiStatusNote assessment={project?.aiAssessment} />
            <p className="text-xs text-amber-900">
              The project stays here until a real AI comparison succeeds. It cannot be marked &ldquo;AI comparison done&rdquo; by hand.
            </p>
            {isOfficial && (
              <Button type="button" variant="secondary" onClick={handleRetry} loading={busy} disabled={busy} className="text-xs">
                <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Retry AI comparison
              </Button>
            )}
          </div>
        )}

        {isOfficial && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
            {message && (
              <p role={message.tone === 'error' ? 'alert' : 'status'} className={`text-sm ${message.tone === 'error' ? 'text-rose-800' : 'text-emerald-800'}`}>
                {message.text}
              </p>
            )}
            {nextStatuses.length === 0 ? (
              <p className="text-sm text-slate-700">
                {FINAL.includes(currentStatus)
                  ? 'This project has a final decision.'
                  : currentStatus === 'Construction Started'
                    ? 'Next: upload the completion photo (in the panel on the left). The AI comparison runs automatically.'
                    : 'No manual change is possible at this stage.'}
              </p>
            ) : (
              <>
                <label htmlFor="lifecycle-next" className="block text-xs font-semibold text-slate-700">Move to</label>
                <select
                  id="lifecycle-next"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">Choose the next stage</option>
                  {nextStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <label htmlFor="lifecycle-remarks" className="block text-xs font-semibold text-slate-700">Remarks</label>
                <textarea
                  id="lifecycle-remarks"
                  value={remarks}
                  maxLength={1000}
                  onChange={(event) => setRemarks(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                <Button type="submit" loading={busy} className="w-full" disabled={!status || busy}>Save stage</Button>
              </>
            )}
          </form>
        )}

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold text-slate-700">History</h4>
          <ul className="mt-3 space-y-3">
            {history.length === 0 ? (
              <li className="text-xs text-slate-600">No activity yet.</li>
            ) : history.map((entry, index) => (
              <li key={`${entry.status}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-dark-800">{entry.status}</span>
                  {entry.updatedBy && <span className="text-xs text-slate-600">{entry.updatedBy}</span>}
                </div>
                <p className="mt-1 text-sm text-slate-700">{entry.remarks || 'No remarks.'}</p>
                <p className="mt-1 text-xs text-slate-600">{new Date(entry.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectLifecycleSection;
