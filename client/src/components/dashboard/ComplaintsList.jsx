import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { updateReportStatus } from '../../services/citizenService.js';
import { MessageSquare, MapPin, Eye, CheckCircle2, ShieldAlert, Image as ImageIcon } from 'lucide-react';

export const ComplaintsList = ({ complaints = [], onStatusUpdated }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateReportStatus(id, newStatus);
      if (onStatusUpdated) {
        onStatusUpdated();
      }
      if (selectedReport && selectedReport._id === id) {
        setSelectedReport(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Resolved</span>;
      case 'Reviewed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">Reviewed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">New Complaint</span>;
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-1.5">
            <MessageSquare className="h-5 w-5 text-brand-600" /> Citizen Complaints Feed
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">Real-time citizen infrastructure audits & damage reports</p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of complaints */}
          <div className="lg:col-span-1 space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 bg-slate-50/50 rounded-md">No citizen complaints registered</p>
            ) : (
              complaints.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedReport(item)}
                  className={`p-3.5 rounded-md border transition-colors cursor-pointer text-xs ${
                    selectedReport?._id === item._id
                      ? 'border-brand-600 bg-brand-50/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${item.flaggedAsDiscrepancy ? 'text-rose-600' : 'text-slate-650'}`}>
                      Match: {item.matchScore}%
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <h4 className="font-semibold text-dark-800 truncate mb-1">{item.project?.title || item.customProjectTitle || 'Unknown Project'}</h4>
                  <p className="text-slate-400 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" /> {item.project?.location?.address || 'N/A'}
                  </p>
                  <p className="text-slate-500 mt-2 line-clamp-2">{item.description}</p>
                </div>
              ))
            )}
          </div>

          {/* Detailed view */}
          <div className="lg:col-span-2 bg-slate-50/20 border border-slate-200 rounded-lg p-6 flex flex-col justify-between min-h-[400px]">
            {selectedReport ? (
              <div className="space-y-5 animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-dark-800">{selectedReport.project?.title || selectedReport.customProjectTitle || 'Custom Project'}</h3>
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" /> GPS: {selectedReport.gps.lat}, {selectedReport.gps.lng}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>

                {/* Visual Evidence (Citizen Image vs Official Image) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" /> Citizen Submitted Photo
                    </span>
                    <a href={selectedReport.citizenImageUrl} target="_blank" rel="noreferrer" className="block relative h-36 rounded-md overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity">
                      <img src={selectedReport.citizenImageUrl} alt="Citizen Proof" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-dark-900/60 text-white font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Zoom
                      </span>
                    </a>
                  </div>
                  
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" /> Official Completion Photo
                    </span>
                    {selectedReport.project?.afterImageUrl ? (
                      <a href={selectedReport.project.afterImageUrl} target="_blank" rel="noreferrer" className="block relative h-36 rounded-md overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity">
                        <img src={selectedReport.project.afterImageUrl} alt="Official Completion" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 bg-dark-900/60 text-white font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Zoom
                        </span>
                      </a>
                    ) : (
                      <div className="h-36 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 italic text-[11px] border border-dashed border-slate-200">
                        Awaiting completed photo
                      </div>
                    )}
                  </div>
                </div>

                {/* Details & AI Report */}
                <div className="space-y-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citizen Narrative</span>
                    <p className="text-xs text-dark-800 mt-1 bg-white p-3 rounded-md border border-slate-200">{selectedReport.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Anomalies Spotted</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedReport.detectedIssues.map(issue => (
                          <span key={issue} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] font-semibold uppercase">
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Compliance Index</span>
                      <span className={`inline-block mt-1.5 font-bold text-sm ${selectedReport.matchScore >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedReport.matchScore}%
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-brand-600" /> Discrepancy Assessment
                    </span>
                    <p className="text-xs text-dark-800 leading-relaxed mt-1 bg-brand-50/10 p-3.5 rounded-md border border-brand-100/20">
                      {selectedReport.aiReport}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                  {selectedReport.status !== 'Reviewed' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedReport._id, 'Reviewed')}
                      disabled={updatingId === selectedReport._id}
                      className="px-5"
                    >
                      Mark Reviewed
                    </Button>
                  )}
                  {selectedReport.status !== 'Resolved' && (
                    <Button
                      variant="primary"
                      onClick={() => handleStatusChange(selectedReport._id, 'Resolved')}
                      disabled={updatingId === selectedReport._id}
                      className="px-5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Resolve Issue
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Select a citizen complaint</p>
                <p className="text-[11px] mt-0.5">Click any report in the left sidebar to audit the damage details and trigger resolutions.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplaintsList;
