import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { AlertCircle, CheckCircle2, ShieldAlert, MessageSquare, ScanSearch } from 'lucide-react';
import { AiStatusNote, SampleDataBadge } from '../ui/AiStatusNote.jsx';
import { DETECTION_STATUS_TEXT, defectLabel, hasAiResult } from '../../lib/aiStatus.js';

const percent = (value) => `${Math.round(value * 100)}%`;

export const DetectionSection = ({ segmentation }) => {
  if (!segmentation) return null;
  const { status, defects = [] } = segmentation;

  if (status === 'completed') {
    return (
      <div>
        <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <ScanSearch className="h-4 w-4 text-brand-700" aria-hidden="true" /> Automated defect detection
        </span>
        {defects.length ? (
          <ul className="space-y-2">
            {defects.map((defect, index) => (
              <li key={`${defect.type}-${index}`} className="rounded-md border border-slate-200 bg-white p-3 text-xs text-dark-800">
                <div className="flex justify-between font-semibold">
                  <span>{defectLabel(defect.type)}</span>
                  <span>{percent(defect.confidence)} model confidence</span>
                </div>
                <p className="mt-1 text-slate-600">
                  Covers about {percent(defect.areaFractionOfImage || 0)} of the photo
                  {defect.areaCm2 ? ` · approx. ${defect.areaCm2} cm² from a measured scale` : ''}.
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">The model ran and found no defects in this photo.</p>
        )}
        <p className="mt-2 text-xs text-slate-600">
          Physical size and depth are not measured from a single photo. An inspector confirms them on site.
        </p>
      </div>
    );
  }

  if (status === 'simulated') {
    return (
      <p role="note" className="rounded-md border-2 border-dashed border-amber-400 bg-amber-50 p-3 text-xs font-medium text-amber-900">
        {DETECTION_STATUS_TEXT.simulated}
      </p>
    );
  }

  const text = DETECTION_STATUS_TEXT[status] || DETECTION_STATUS_TEXT.unavailable;
  return <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{text}</p>;
};

export const DiscrepancyReport = ({ result }) => {
  if (!result) return null;

  const { detectedIssues = [], matchScore, flaggedAsDiscrepancy = false, aiReport = '', aiAssessment, segmentation, severity } = result;
  const aiRan = hasAiResult(aiAssessment);

  return (
    <Card className="border-t-4 border-t-brand-700">
      <CardHeader>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-brand-700">Automated review</span>
            <CardTitle className="mt-0.5 flex items-center gap-1.5 text-lg">
              <CheckCircle2 className="h-4.5 w-4.5 text-brand-600" aria-hidden="true" /> Report summary
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <SampleDataBadge record={result} />
            {aiRan && (flaggedAsDiscrepancy ? (
              <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Problem visible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> No clear problem visible
              </span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-xs text-slate-700">
          Severity for triage: <strong>{severity || 'Unassessed'}</strong>
          {severity === 'Unassessed' ? ' (no automated review was available; an official will look at it).' : '.'}
        </p>

        <AiStatusNote assessment={aiAssessment} />

        {aiRan && (
          <>
            {typeof matchScore === 'number' && (
              <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-md border border-slate-300 bg-white font-bold text-dark-800">
                  <span className="text-xl leading-none tracking-tight">{matchScore}</span>
                  <span className="mt-0.5 text-xs font-semibold">/ 100</span>
                </div>
                <p className="text-xs leading-normal text-slate-700">
                  Consistency with the project&rsquo;s official photo, as judged by the AI image review. Lower means the
                  photo shows something different from the recorded work.
                </p>
              </div>
            )}

            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-700">Problems the AI saw</span>
              <div className="flex flex-wrap gap-1.5">
                {detectedIssues.filter((issue) => issue !== 'none').length === 0 ? (
                  <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700">None identified</span>
                ) : (
                  detectedIssues.filter((issue) => issue !== 'none').map((issue) => (
                    <span key={issue} className="inline-flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" /> {defectLabel(issue)}
                    </span>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <DetectionSection segmentation={segmentation} />

        {aiRan && aiReport && (
          <div className="border-t border-slate-200 pt-4">
            <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <MessageSquare className="h-4 w-4 text-slate-600" aria-hidden="true" /> AI notes (advisory)
            </span>
            <p className="rounded-md border border-slate-200 bg-white p-4 text-xs leading-relaxed text-dark-800">{aiReport}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscrepancyReport;
