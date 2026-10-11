import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout.jsx';
import CitizenReportForm from '../components/citizen/CitizenReportForm.jsx';
import DiscrepancyReport from '../components/citizen/DiscrepancyReport.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getCitizenReports, getMyRewards } from '../services/citizenService.js';
import { getNotifications, markNotificationAsRead } from '../services/dashboardService.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx';
import { 
  FileText, 
  MapPin, 
  Clock, 
  User, 
  Award, 
  Bell, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  UserCheck,
  Calendar,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

export const CitizenVerificationPage = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('submit');

  // Track complaints
  const [myComplaints, setMyComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Rewards
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Submission callback
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    if (activeSubTab === 'track') {
      loadComplaints();
    } else if (activeSubTab === 'rewards') {
      loadRewards();
    } else if (activeSubTab === 'notifications') {
      loadNotifications();
    }
  }, [activeSubTab]);

  const loadComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const data = await getCitizenReports();
      // Filter only complaints submitted by the logged in citizen
      const filtered = data.filter(c => c.citizen?._id === user?._id || c.citizen === user?._id);
      setMyComplaints(filtered);
      if (filtered.length > 0) {
        setSelectedComplaint(filtered[0]);
      }
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const loadRewards = async () => {
    setRewards([]);
    setLoadingRewards(true);
    try {
      const data = await getMyRewards();
      setRewards(data);
    } catch (err) {
      console.error('Failed to load rewards', err);
    } finally {
      setLoadingRewards(false);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportSubmitted = (result) => {
    setVerificationResult(result);
    // Reload tracking in background
    loadComplaints();
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  return (
    <PageLayout title="Citizen Verification Portal">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Summary Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center text-dark-800 font-bold">
              <User className="h-6 w-6 text-slate-500" />
            </div>
            <div>
              <h3 className="font-bold text-dark-800 text-sm">{user?.name}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Citizen Auditor • Registered via {user?.email || user?.phone || 'Mobile'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded px-4 py-2 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Civic Points</p>
              <p className="text-lg font-black text-emerald-600">{user?.points || 0}</p>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded px-4 py-2 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Volunteer Score</p>
              <p className="text-lg font-black text-brand-600">{user?.volunteerScore || 0}</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-1">
          <button
            onClick={() => setActiveSubTab('submit')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSubTab === 'submit'
                ? 'border-b-2 border-brand-500 text-brand-600 bg-white'
                : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            New complaint
          </button>
          <button
            onClick={() => setActiveSubTab('track')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSubTab === 'track'
                ? 'border-b-2 border-brand-500 text-brand-600 bg-white'
                : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            My complaints ({myComplaints.length})
          </button>
          <button
            onClick={() => setActiveSubTab('rewards')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSubTab === 'rewards'
                ? 'border-b-2 border-brand-500 text-brand-600 bg-white'
                : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            Rewards
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSubTab === 'notifications'
                ? 'border-b-2 border-brand-500 text-brand-600 bg-white'
                : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            Notifications ({notifications.filter(n => !n.read).length})
          </button>
        </div>

        {/* Sub-tab Content Area */}
        <div className="mt-4">
          {activeSubTab === 'submit' && (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <CitizenReportForm onSubmitSuccess={handleReportSubmitted} />
              {verificationResult && (
                <DiscrepancyReport result={verificationResult} />
              )}
            </div>
          )}

          {activeSubTab === 'track' && (
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
                      <div className="text-center py-12 text-slate-450 text-xs italic">
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
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold rounded text-slate-650 transition-colors"
                            >
                              <FileText className="h-3 w-3 text-slate-400" /> Export PDF
                            </button>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          selectedComplaint.severity === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100' : selectedComplaint.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-150'
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
                            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Current Status</span>
                            <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" /> {selectedComplaint.status}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Assigned Inspector</span>
                            <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" /> {selectedComplaint.assignedOfficer?.name || 'Awaiting Allocation'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Inspection Date</span>
                            <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(selectedComplaint.inspectionDate)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Resolution ETA</span>
                            <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" /> {formatDate(selectedComplaint.resolutionEta)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">GPS Coordinates</span>
                            <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" /> {selectedComplaint.gps.lat.toFixed(4)}, {selectedComplaint.gps.lng.toFixed(4)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Duplicate Check</span>
                            <span className="font-medium text-slate-700 mt-0.5 block">
                              {selectedComplaint.duplicateFound ? 'Yes (Flagged as Duplicate)' : 'No duplicates detected'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Defects Flagged by AI</span>
                            <span className="font-medium text-brand-650 mt-0.5 block capitalize">
                              {selectedComplaint.detectedIssues?.join(', ') || 'None'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Citizen Complaint Notes</span>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">{selectedComplaint.description}</p>
                      </div>

                      {/* Inspector Notes & Resolution Summary */}
                      {selectedComplaint.inspectorNotes && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Inspector Site Notes</span>
                          <p className="text-slate-600 text-xs mt-1 italic leading-relaxed bg-brand-50/10 p-2.5 rounded border border-brand-100">{selectedComplaint.inspectorNotes}</p>
                        </div>
                      )}

                      {selectedComplaint.resolutionSummary && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Resolution Summary / Action Taken</span>
                          <p className="text-emerald-800 text-xs mt-1 font-semibold leading-relaxed bg-emerald-50/20 p-2.5 rounded border border-emerald-100">{selectedComplaint.resolutionSummary}</p>
                        </div>
                      )}

                      {/* Before / After Evidence Images */}
                      <div className="border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block mb-2">Before and after</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-500 font-semibold mb-1 text-center">Your photo</p>
                            <div className="border border-slate-200 rounded-lg overflow-hidden h-40 bg-slate-50">
                              <img src={selectedComplaint.citizenImageUrl} alt="Citizen before" className="w-full h-full object-cover" />
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-500 font-semibold mb-1 text-center">Official Verification Proof (After)</p>
                            <div className="border border-slate-200 rounded-lg overflow-hidden h-40 bg-slate-50 flex items-center justify-center text-slate-450 text-xs italic">
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
                  <Card className="h-64 flex items-center justify-center text-slate-450 text-xs italic border border-dashed border-slate-300">
                    Awaiting Selection
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'rewards' && (
            <div className="space-y-6">
              {/* Badges Display */}
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Earned Civic Badges</h3>
                <div className="flex flex-wrap gap-2.5">
                  {user?.badges?.length > 0 ? (
                    user.badges.map((badge, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full shadow-sm">
                        <Award className="h-3.5 w-3.5" /> {badge}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-450 text-xs italic">No badges earned yet. Submit verified reports to earn badges.</span>
                  )}
                </div>
              </div>

              {/* Rewards List */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historical Reward Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingRewards ? (
                    <div className="text-center py-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-600 mx-auto" />
                    </div>
                  ) : rewards.length === 0 ? (
                    <div className="text-center py-12 text-slate-450 text-xs italic">
                      No rewards generated yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <th className="px-6 py-2.5">Reward Detail</th>
                            <th className="px-6 py-2.5">Type</th>
                            <th className="px-6 py-2.5 text-center">Reward Score</th>
                            <th className="px-6 py-2.5 text-right">Date Issued</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {rewards.map(rew => (
                            <tr key={rew._id} className="hover:bg-slate-50/50">
                              <td className="px-6 py-3 font-semibold text-dark-800">
                                {rew.title}
                                <span className="block text-[10px] text-slate-450 font-normal mt-0.5">{rew.description}</span>
                              </td>
                              <td className="px-6 py-3 text-slate-600">{rew.rewardType}</td>
                              <td className="px-6 py-3 text-center text-emerald-600 font-bold">+{rew.amount}</td>
                              <td className="px-6 py-3 text-right text-slate-400">{formatDate(rew.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSubTab === 'notifications' && (
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="h-4 w-4" /> Message Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingNotifications ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-600 mx-auto" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-450 text-xs italic">
                    No notifications available.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(notif => (
                      <div key={notif._id} className={`p-4 flex items-start justify-between gap-3 ${notif.read ? 'opacity-60 bg-white' : 'bg-brand-50/10'}`}>
                        <div className="flex gap-2.5">
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
                            notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' : notif.type === 'warning' ? 'bg-amber-50 text-amber-600' : notif.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {notif.type === 'success' ? <CheckCircle className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
                          </div>
                          <div>
                            <p className="text-xs text-dark-800 leading-normal font-medium">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">{formatDate(notif.createdAt)}</span>
                          </div>
                        </div>
                        
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkNotificationRead(notif._id)}
                            className="text-[10px] text-brand-600 hover:text-brand-700 font-bold shrink-0"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </PageLayout>
  );
};

export default CitizenVerificationPage;
