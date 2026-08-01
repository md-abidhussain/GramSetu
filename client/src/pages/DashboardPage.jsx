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

      setSummary(sum);
      setRiskAnalytics(risk);
      setContractors(leaders);
      setComplaints(comp);
      setMapData(map);
      setProjects(proj);
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
      <PageLayout title="Official Authority Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-2.5">
          <Activity className="h-8 w-8 text-brand-600 animate-spin" />
          <p className="text-xs font-semibold">Loading official government audits...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Official Authority Dashboard">
      <div className="space-y-8">
        {/* Title bar and refresh button */}
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-xl font-bold text-dark-800 tracking-tight">System Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time indicators of public infrastructure integrity ledger</p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Sync Ledger'}
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
