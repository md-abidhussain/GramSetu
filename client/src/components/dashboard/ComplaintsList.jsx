import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { 
  assignInspector, 
  scheduleInspection, 
  uploadInspectionVerification, 
  resolveComplaint,
  getInspectors
} from '../../services/citizenService.js';
import { 
  MessageSquare, 
  MapPin, 
  Eye, 
  ShieldAlert, 
  Image as ImageIcon, 
  UserCheck, 
  Calendar, 
  FileText,
  AlertCircle
} from 'lucide-react';

export const ComplaintsList = ({ complaints = [], onStatusUpdated }) => {
  const { user } = useAuth(); // Logged-in authority official
  const [selectedReport, setSelectedReport] = useState(null);
  const detailPanelRef = useRef(null);

  // Below a wide screen the detail sits under the list instead of beside it,
  // far enough down that picking a complaint looked like nothing happened.
  useEffect(() => {
    if (!selectedReport || !detailPanelRef.current) return;
    const { top, bottom } = detailPanelRef.current.getBoundingClientRect();
    const outOfView = top > window.innerHeight * 0.75 || bottom < 0;
    if (outOfView) {
      detailPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedReport]);
  
  // Dynamic inspectors list for assignments
  const [inspectors, setInspectors] = useState([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  
  // Inspection scheduling
  const [scheduleDate, setScheduleDate] = useState('');
  
  // Verification uploads
  const [inspectorFile, setInspectorFile] = useState(null);
  const [inspectorNotes, setInspectorNotes] = useState('');
  
  // Resolutions
  const [resolutionSummary, setResolutionSummary] = useState('');

  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Load registered Inspectors on mount
  useEffect(() => {
    const fetchInspectors = async () => {
      try {
        const list = await getInspectors();
        setInspectors(list);
        if (list.length > 0) {
          setSelectedInspectorId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to load inspectors list', err);
      }
    };
    fetchInspectors();
  }, []);

  // Update selected report details when complaints feed updates
  useEffect(() => {
    if (selectedReport) {
      const updated = complaints.find(c => c._id === selectedReport._id);
      if (updated) {
        setSelectedReport(updated);
      }
    }
  }, [complaints]);

  // Handler: Assign Inspector
  const handleAssignInspector = async () => {
    if (!selectedReport || !selectedInspectorId) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await assignInspector(selectedReport._id, selectedInspectorId);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setActionError(err.message || 'Inspector assignment failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handler: Schedule Date
  const handleScheduleInspection = async () => {
    if (!selectedReport || !scheduleDate) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await scheduleInspection(selectedReport._id, scheduleDate);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to schedule inspection.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handler: Upload Verification Evidence
  const handleUploadVerification = async (e) => {
    e.preventDefault();
    if (!selectedReport || !inspectorFile) {
      setActionError('Verification photo is required');
      return;
    }
    setLoadingAction(true);
    setActionError(null);
    try {
      const formData = new FormData();
      formData.append('reportId', selectedReport._id);
      formData.append('image', inspectorFile);
      formData.append('inspectorNotes', inspectorNotes);

      await uploadInspectionVerification(formData);
      setInspectorFile(null);
      setInspectorNotes('');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to upload verification evidence.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handler: Resolve Complaint
  const handleResolveComplaint = async (decision) => {
    if (!selectedReport || !resolutionSummary) {
      setActionError('Resolution summary remarks are required before finalizing decision.');
      return;
    }
    setLoadingAction(true);
    setActionError(null);
    try {
      await resolveComplaint(selectedReport._id, decision, resolutionSummary);
      setResolutionSummary('');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to record decision.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Resolution Published':
      case 'Accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Inspector Assigned':
      case 'Inspection Scheduled':
      case 'Inspector Uploads Verification':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-1.5 text-base">
            <MessageSquare className="h-5 w-5 text-brand-600" /> Government Complaints Review Feed
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">Audit municipal defect notifications and direct local inspection tasks</p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Complaints Feed List */}
          <div className="lg:col-span-1 space-y-3 max-h-[520px] overflow-y-auto pr-2">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 bg-slate-50/50 rounded-md">No citizen complaints registered</p>
            ) : (
              complaints.map((item) => (
                <div
                  key={item._id}
                  onClick={() => {
                    setSelectedReport(item);
                    setActionError(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedReport(item);
                      setActionError(null);
                    }
                  }}
                  className={`p-3.5 rounded border transition-colors cursor-pointer text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    selectedReport?._id === item._id
                      ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                      : 'border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-rose-600">Match Index: {item.matchScore}%</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusBadgeColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-dark-800 truncate mb-0.5">{item.project?.title || item.customProjectTitle || 'Custom Report'}</h4>
                  <p className="text-slate-400 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" /> {item.project?.location?.address || 'Custom Coordinates'}
                  </p>
                  <p className="text-slate-500 mt-2 line-clamp-2">{item.description}</p>
                </div>
              ))
            )}
          </div>

          {/* Detailed Workflow Actions Panel */}
          <div
            ref={detailPanelRef}
            className="lg:col-span-2 bg-slate-50/30 border border-slate-200 rounded-lg p-5 flex flex-col justify-between min-h-[480px]"
          >
            {selectedReport ? (
              <div className="space-y-4 animate-fadeIn text-xs">
                
                {/* Header */}
                <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-dark-800">
                      {selectedReport.project?.title || selectedReport.customProjectTitle || 'Custom Project Site'}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Reporter: {selectedReport.citizen?.name || 'Anonymous Citizen'} • Severity: <span className="font-semibold text-rose-600">{selectedReport.severity}</span>
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadgeColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>

                {actionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Evidence Photo Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-slate-400 font-bold mb-1.5 flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Citizen Evidence
                    </span>
                    <a href={selectedReport.citizenImageUrl} target="_blank" rel="noreferrer" className="block relative h-32 rounded border border-slate-200 overflow-hidden bg-white hover:opacity-90 transition-opacity">
                      <img src={selectedReport.citizenImageUrl} alt="Citizen Upload" className="w-full h-full object-cover" />
                    </a>
                  </div>

                  <div>
                    <span className="block text-xs text-slate-400 font-bold mb-1.5 flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Official Site Verification
                    </span>
                    {selectedReport.inspectorAfterImageUrl ? (
                      <a href={selectedReport.inspectorAfterImageUrl} target="_blank" rel="noreferrer" className="block relative h-32 rounded border border-slate-200 overflow-hidden bg-white hover:opacity-90 transition-opacity">
                        <img src={selectedReport.inspectorAfterImageUrl} alt="Inspector Upload" className="w-full h-full object-cover" />
                      </a>
                    ) : (
                      <div className="h-32 rounded border border-dashed border-slate-200 flex items-center justify-center text-slate-400 italic">
                        Inspection evidence not uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Info summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3.5 rounded border border-slate-200">
                  <div className="space-y-1">
                    <p><span className="text-slate-400 font-medium">Assigned Officer:</span> <span className="font-semibold">{selectedReport.assignedOfficer?.name || 'Not Assigned'}</span></p>
                    <p><span className="text-slate-400 font-medium">Inspection Date:</span> <span className="font-semibold">{formatDate(selectedReport.inspectionDate) || 'Not Scheduled'}</span></p>
                    <p><span className="text-slate-400 font-medium">Resolution ETA:</span> <span className="font-semibold">{formatDate(selectedReport.resolutionEta) || 'TBD'}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-slate-400 font-medium">Duplicate Check:</span> <span className="font-semibold text-amber-600">{selectedReport.duplicateFound ? 'Duplicate Found' : 'Clean'}</span></p>
                    <p><span className="text-slate-400 font-medium">Detected Anomalies:</span> <span className="font-semibold text-rose-600 capitalize">{selectedReport.detectedIssues?.join(', ') || 'None'}</span></p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-xs text-slate-500 font-bold">Citizen Narrative</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">{selectedReport.description}</p>
                </div>

                {/* Gemini comparative report analysis if discrepancies exist */}
                {selectedReport.aiReport && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="block text-xs text-slate-500 font-bold flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-brand-600" /> AI Discrepancy Assessment
                    </span>
                    <p className="text-slate-700 bg-brand-50/15 border border-brand-100 p-2.5 rounded mt-1.5 leading-relaxed">
                      {selectedReport.aiReport}
                    </p>
                  </div>
                )}

                {/* Inspector Site Notes */}
                {selectedReport.inspectorNotes && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="block text-xs text-slate-500 font-bold">Inspector Notes</span>
                    <p className="text-slate-700 bg-slate-100/50 border border-slate-200 p-2.5 rounded mt-1.5 leading-relaxed italic">
                      {selectedReport.inspectorNotes}
                    </p>
                  </div>
                )}

                {/* RESOLUTION FLOW OPTIONS */}
                <div className="border-t border-slate-200 pt-4 mt-6">
                  
                  {/* Step 1: Assign Inspector (District Authority / Admin only) */}
                  {(selectedReport.status === 'Authority Notification' || selectedReport.status === 'Complaint Submitted' || selectedReport.status === 'Duplicate Detected') && 
                   (user.role === 'District Authority' || user.role === 'Admin' || user.role === 'Government Officer') && (
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-slate-500 flex items-center gap-1">
                        <UserCheck className="h-4 w-4" /> 1. Assign Site Inspector
                      </h4>
                      <div className="flex gap-2">
                        <select
                          value={selectedInspectorId}
                          onChange={(e) => setSelectedInspectorId(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
                        >
                          {inspectors.map(ins => (
                            <option key={ins._id} value={ins._id}>
                              {ins.name} ({ins.uniqueUserId})
                            </option>
                          ))}
                        </select>
                        <Button
                          onClick={handleAssignInspector}
                          loading={loadingAction}
                          disabled={loadingAction || !selectedInspectorId}
                          className="px-4 py-1.5"
                        >
                          Assign Official
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Schedule Site Visit (Assigned Inspector only) */}
                  {selectedReport.status === 'Inspector Assigned' && 
                   (selectedReport.assignedOfficer?._id === user._id || user.role === 'Admin') && (
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-slate-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> 2. Schedule Inspection Visit
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                        />
                        <Button
                          onClick={handleScheduleInspection}
                          loading={loadingAction}
                          disabled={loadingAction || !scheduleDate}
                          className="px-4 py-1.5 animate-fadeIn"
                        >
                          Schedule Visit
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Upload Inspector Evidence Photos (Assigned Inspector only) */}
                  {selectedReport.status === 'Inspection Scheduled' && 
                   (selectedReport.assignedOfficer?._id === user._id || user.role === 'Admin') && (
                    <form onSubmit={handleUploadVerification} className="space-y-3">
                      <h4 className="font-bold text-slate-500 flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" /> 3. Submit Inspection Verification Details
                      </h4>
                      
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setInspectorFile(e.target.files[0])}
                          required
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5"
                        />
                        <textarea
                          placeholder="Provide Inspector comments / defect remarks..."
                          value={inspectorNotes}
                          onChange={(e) => setInspectorNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                        />
                        <Button
                          type="submit"
                          loading={loadingAction}
                          disabled={loadingAction || !inspectorFile}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700"
                        >
                          Submit Verification Proof
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Step 4: Authority Review Decision (District Authority / Officer only) */}
                  {(selectedReport.status === 'Inspector Uploads Verification' || 
                    selectedReport.status === 'Gemini Analysis' || 
                    selectedReport.status === 'AI Agent Validation') && 
                   (user.role === 'District Authority' || user.role === 'Admin' || user.role === 'Government Officer') && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-500 flex items-center gap-1">
                        <FileText className="h-4 w-4" /> 4. Final Official Resolution Decision
                      </h4>
                      
                      <textarea
                        placeholder="Provide details on resolution work completed, repairs initialized, or justifications..."
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                        required
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                      
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => handleResolveComplaint('Need More Evidence')}
                          disabled={loadingAction}
                          className="px-4 py-2 border border-slate-200 rounded hover:bg-slate-50 font-bold"
                        >
                          Need More Evidence
                        </button>
                        <button
                          onClick={() => handleResolveComplaint('Rejected')}
                          disabled={loadingAction}
                          className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 rounded font-bold"
                        >
                          Reject Complaint
                        </button>
                        <button
                          onClick={() => handleResolveComplaint('Accepted')}
                          disabled={loadingAction}
                          className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-bold shadow"
                        >
                          Accept & Publish Resolution
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedReport.status === 'Resolution Published' && (
                    <div className="bg-emerald-50/20 border border-emerald-100 p-3 rounded text-emerald-800 text-center font-bold">
                      ✔️ Issue Resolution Published & Citizen Rewarded.
                    </div>
                  )}

                  {selectedReport.status === 'Rejected' && (
                    <div className="bg-rose-50/20 border border-rose-100 p-3 rounded text-rose-800 text-center font-bold">
                      ❌ Complaint was Rejected by Authority.
                    </div>
                  )}

                  {selectedReport.status === 'Need More Evidence' && (
                    <div className="bg-amber-50/20 border border-amber-100 p-3 rounded text-amber-800 text-center font-bold">
                      ⚠️ Authority requires additional evidence. Awaiting Citizen Update.
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Choose a complaint to review</p>
                <p className="text-sm mt-1 max-w-xs">Pick one from the list to see who reported it, what they reported, and to assign an inspector.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplaintsList;
