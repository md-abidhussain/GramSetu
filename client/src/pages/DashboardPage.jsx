import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/layout/PageLayout.jsx';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts.jsx';
import RiskChart from '../components/dashboard/RiskChart.jsx';
import MapView from '../components/dashboard/MapView.jsx';
import ContractorLeaderboard from '../components/dashboard/ContractorLeaderboard.jsx';
import ProjectsTable from '../components/dashboard/ProjectsTable.jsx';
import ComplaintsList from '../components/dashboard/ComplaintsList.jsx';

import {
  getDashboardSummary,
  getRiskAnalytics,
  getContractorLeaderboard,
  getDashboardComplaints,
  getMapPlotData
} from '../services/dashboardService.js';
import { getProjects } from '../services/monitoringService.js';
import { Activity, RefreshCw } from 'lucide-react';

export const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [riskAnalytics, setRiskAnalytics] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [sum, risk, leaders, comp, map, proj] = await Promise.all([
        getDashboardSummary(),
        getRiskAnalytics(),
        getContractorLeaderboard(),
        getDashboardComplaints(),
        getMapPlotData(),
        getProjects()
      ]);

      // Each panel reads its own slice. If one endpoint answers with something
      // unexpected, that panel shows nothing rather than the whole dashboard
      // failing on a .filter or .map of a non-array.
      const asList = (value) => (Array.isArray(value) ? value : []);

      setSummary(sum && typeof sum === 'object' ? sum : {});
      setRiskAnalytics(asList(risk));
      setContractors(asList(leaders));
      setComplaints(asList(comp));
      setMapData(asList(map));
      setProjects(asList(proj));
    } catch (err) {
      console.error('Failed to load dashboard parameters:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-slate-600">
          <Activity className="h-8 w-8 text-brand-600 animate-spin" />
          <p className="text-base">Loading your dashboard…</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dashboard">
      <div className="space-y-8">
        {/* Title bar and refresh button */}
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Today at a glance</h2>
            <p className="mt-1 text-sm text-slate-600">Projects being tracked, what the public has reported, and what needs attention.</p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Analytics Cards */}
        <AnalyticsCharts summary={summary} />

        {/* Maps and Leaderboards section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-2 space-y-6">
            <MapView mapData={mapData} />
            <RiskChart analytics={riskAnalytics} />
          </div>
          <div className="lg:col-span-1">
            <ContractorLeaderboard contractors={contractors} />
          </div>
        </div>

        {/* Projects table */}
        <ProjectsTable projects={projects} />

        {/* Complaints list */}
        <ComplaintsList complaints={complaints} onStatusUpdated={() => fetchDashboardData(true)} />
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
