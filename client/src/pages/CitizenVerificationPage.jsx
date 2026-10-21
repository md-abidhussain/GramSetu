import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout.jsx';
import CitizenReportForm from '../components/citizen/CitizenReportForm.jsx';
import DiscrepancyReport from '../components/citizen/DiscrepancyReport.jsx';
import MyComplaints from '../components/citizen/MyComplaints.jsx';
import RewardsPanel from '../components/citizen/RewardsPanel.jsx';
import NotificationsPanel from '../components/citizen/NotificationsPanel.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getCitizenReports, getMyRewards } from '../services/citizenService.js';
import { getNotifications, markNotificationAsRead } from '../services/dashboardService.js';
import { User } from 'lucide-react';

export const CitizenVerificationPage = () => {
  const { user } = useAuth();
  // Which section is open comes from the address bar, so the sidebar can link
  // straight to one and a citizen can bookmark it.
  const [searchParams] = useSearchParams();
  const activeSubTab = searchParams.get('tab') || 'submit';

  // Track complaints
  const [myComplaints, setMyComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintsError, setComplaintsError] = useState(null);

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
    // Reloads only when the tab changes; the loaders are recreated each render.
     
  }, [activeSubTab]);

  const loadComplaints = async () => {
    setLoadingComplaints(true);
    try {
      // The server returns only this citizen's own complaints.
      setMyComplaints(await getCitizenReports());
      setComplaintsError(null);
    } catch (err) {
      setComplaintsError(err.message || 'Your reports could not be loaded.');
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


  return (
    <PageLayout title="Your reports">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Summary Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center text-dark-800 font-bold">
              <User className="h-6 w-6 text-slate-500" />
            </div>
            <div>
              <h3 className="font-bold text-dark-800 text-sm">{user?.name}</h3>
              <p className="mt-0.5 text-sm text-slate-600">{user?.email || user?.phone || 'Signed in'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded px-4 py-2 text-center">
              <p className="text-sm font-medium text-slate-700">Points earned</p>
              <p className="text-lg font-black text-emerald-800">{user?.points || 0}</p>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded px-4 py-2 text-center">
              <p className="text-sm font-medium text-slate-700">Reports accepted</p>
              <p className="text-lg font-black text-brand-600">{user?.volunteerScore || 0}</p>
            </div>
          </div>
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
            <div>
            {complaintsError && (
              <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {complaintsError}{' '}
                <button type="button" onClick={loadComplaints} className="font-semibold underline">Try again</button>
              </p>
            )}
            <MyComplaints complaints={myComplaints} loading={loadingComplaints} />
            </div>
          )}

          {activeSubTab === 'rewards' && (
            <RewardsPanel rewards={rewards} loading={loadingRewards} user={user} />
          )}

          {activeSubTab === 'notifications' && (
            <NotificationsPanel notifications={notifications} loading={loadingNotifications} onMarkRead={handleMarkNotificationRead} />
          )}

        </div>
      </div>
    </PageLayout>
  );
};

export default CitizenVerificationPage;
