import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { formatDate } from '../../lib/formatDate.js';
import { FileText, MapPin, Clock, UserCheck, Calendar, CheckCircle2, ListFilter } from 'lucide-react';

// Render complaint lifecycle milestones
const renderWorkflowMilestones = (status) => {
  const steps = [
    { name: 'Submitted', key: ['Complaint Submitted', 'AI Analysis', 'Duplicate Detected'] },
    { name: 'AI Verified', key: ['Severity Detected', 'Geo Verification', 'Authority Notification'] },
    { name: 'Inspection', key: ['Inspector Assigned', 'Inspection Scheduled', 'Inspector Uploads Verification', 'Gemini Analysis', 'AI Agent Validation'] },
    { name: 'Decision', key: ['Accepted', 'Rejected', 'Need More Evidence', 'Resolution Published'] }
  ];

  let currentStepIndex = 0;
  if (steps[1].key.includes(status)) currentStepIndex = 1;
  else if (steps[2].key.includes(status)) currentStepIndex = 2;
  else if (steps[3].key.includes(status)) currentStepIndex = 3;

  return (
    <div className="flex items-center justify-between w-full py-4 border-b border-slate-100 mb-5">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isActive = idx === currentStepIndex;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center relative">
            {idx > 0 && (
              <div className={`absolute top-4 left-0 right-1/2 h-[2px] -z-10 ${
                idx <= currentStepIndex ? 'bg-brand-500' : 'bg-slate-200'
              }`} style={{ left: '-50%', width: '100%' }} />
            )}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow ${
              isCompleted ? 'bg-brand-600 text-white' : isActive ? 'bg-brand-500 text-white border-2 border-brand-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={`text-[10px] font-bold mt-1.5 ${isActive ? 'text-brand-600' : 'text-slate-500'}`}>
              {step.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// The complaints this citizen has filed, and how far each one has got.
export const MyComplaints = ({ complaints: myComplaints, loading: loadingComplaints }) => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Complaints List (Left Side) */}
      <div className="lg:col-span-1 space-y-3">
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="h-4 w-4" /> My Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingComplaints ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-600 mx-auto" />
              </div>
            ) : myComplaints.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                No complaints submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                {myComplaints.map(comp => (
                  <div
                    key={comp._id}
                    onClick={() => setSelectedComplaint(comp)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left block w-full ${
                      selectedComplaint?._id === comp._id ? 'bg-slate-50 border-l-2 border-brand-500' : ''
                    }`}
                  >
                    <p className="font-semibold text-dark-800 text-xs truncate">
                      {comp.project?.title || comp.customProjectTitle || 'Custom Report'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{comp.description}</p>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[9px] text-slate-400">{formatDate(comp.createdAt)}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        comp.status === 'Resolution Published' ? 'bg-emerald-50 text-emerald-700' : comp.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaint Tracker Details (Right Side) */}
      <div className="lg:col-span-2">
        {selectedComplaint ? (
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="text-sm font-bold text-dark-800">
                    {selectedComplaint.project?.title || selectedComplaint.customProjectTitle || 'Custom Project Audit'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">Complaint ID: #{selectedComplaint._id.toString().slice(-6).toUpperCase()}</span>
                    <button
                      onClick={() => window.open(`/api/citizen-reports/${selectedComplaint._id}/report`, '_blank')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold rounded text-slate-700 transition-colors"
                    >
                      <FileText className="h-3 w-3 text-slate-400" /> Export PDF
                    </button>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  selectedComplaint.severity === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100' : selectedComplaint.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  Severity: {selectedComplaint.severity}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Workflow Milestones */}
              {renderWorkflowMilestones(selectedComplaint.status)}

              {/* Detail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Current Status</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {selectedComplaint.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Assigned Inspector</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" /> {selectedComplaint.assignedOfficer?.name || 'Awaiting Allocation'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Inspection Date</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(selectedComplaint.inspectionDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Resolution ETA</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {formatDate(selectedComplaint.resolutionEta)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">GPS Coordinates</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> {selectedComplaint.gps.lat.toFixed(4)}, {selectedComplaint.gps.lng.toFixed(4)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Duplicate Check</span>
                    <span className="font-medium text-slate-700 mt-0.5 block">
                      {selectedComplaint.duplicateFound ? 'Yes (Flagged as Duplicate)' : 'No duplicates detected'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Defects Flagged by AI</span>
                    <span className="font-medium text-brand-700 mt-0.5 block capitalize">
                      {selectedComplaint.detectedIssues?.join(', ') || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Citizen Complaint Notes</span>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">{selectedComplaint.description}</p>
              </div>

              {/* Inspector Notes & Resolution Summary */}
              {selectedComplaint.inspectorNotes && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Inspector Site Notes</span>
                  <p className="text-slate-600 text-xs mt-1 italic leading-relaxed bg-brand-50/10 p-2.5 rounded border border-brand-100">{selectedComplaint.inspectorNotes}</p>
                </div>
              )}

              {selectedComplaint.resolutionSummary && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Resolution Summary / Action Taken</span>
                  <p className="text-emerald-800 text-xs mt-1 font-semibold leading-relaxed bg-emerald-50/20 p-2.5 rounded border border-emerald-100">{selectedComplaint.resolutionSummary}</p>
                </div>
              )}

              {/* Before / After Evidence Images */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Before and after</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-1 text-center">Your photo</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden h-40 bg-slate-50">
                      <img src={selectedComplaint.citizenImageUrl} alt="Citizen before" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-1 text-center">Official Verification Proof (After)</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden h-40 bg-slate-50 flex items-center justify-center text-slate-500 text-xs italic">
                      {selectedComplaint.inspectorAfterImageUrl ? (
                        <img src={selectedComplaint.inspectorAfterImageUrl} alt="Inspector after" className="w-full h-full object-cover" />
                      ) : (
                        'Inspector verification photo pending'
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        ) : (
          <Card className="h-64 flex items-center justify-center text-slate-500 text-xs italic border border-dashed border-slate-300">
            Awaiting Selection
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
