import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/layout/PageLayout.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Select.jsx';
import { getContractorAnalysis, getContractors } from '../services/contractorService.js';
import { BarChart3, TrendingUp, ShieldCheck, MessageSquareQuote, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export const ContractorAnalysisPage = () => {
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadContractors = async () => {
      try {
        const data = await getContractors();
        setContractors(data);
        if (data.length > 0) {
          setSelectedContractor(data[0]._id);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadContractors();
  }, []);

  useEffect(() => {
    if (!selectedContractor) return;

    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getContractorAnalysis(selectedContractor);
        setAnalysis(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [selectedContractor]);

  const filteredHistory = useMemo(() => {
    if (!analysis?.history) return [];
    if (filter === 'all') return analysis.history;
    return analysis.history.filter((entry) => entry.status === filter);
  }, [analysis, filter]);

  return (
    <PageLayout title="Contractor Trust Analytics">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4.5 w-4.5 text-brand-600" /> Contractor Performance & Trust Review
                </CardTitle>
                <p className="text-xs text-slate-600 mt-1">Historical project performance, feedback themes, and trust indicators</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <Filter className="h-4 w-4" />
                  <Select
                    id="contractor-filter"
                    placeholder="Filter by status"
                    options={[
                      { value: 'all', label: 'All projects' },
                      { value: 'Verified', label: 'Verified' },
                      { value: 'Flagged', label: 'Flagged' },
                      { value: 'Pending', label: 'Pending' }
                    ]}
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    className="!border-0 !bg-transparent !p-0 !shadow-none !text-sm"
                  />
                </div>
                <Select
                  id="contractor-select"
                  placeholder="Select contractor"
                  options={contractors.map((contractor) => ({ value: contractor._id, label: contractor.name }))}
                  value={selectedContractor}
                  onChange={(event) => setSelectedContractor(event.target.value)}
                  className="min-w-[220px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading analysis dashboard...</p>
            ) : !analysis ? (
              <p className="text-sm text-slate-500">Select a contractor to inspect the trust profile.</p>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-600">Total Projects</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{analysis.metrics.totalProjects}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-600">Completion Score</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{analysis.metrics.averageCompletionScore}%</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-600">On-Time Rate</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{analysis.metrics.onTimeRate}%</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-600">Trust Score</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{analysis.metrics.trustScore}/100</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                        <TrendingUp className="h-4 w-4 text-brand-600" /> Trust summary
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{analysis.metrics.trustScore}/100</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500" style={{ width: `${analysis.metrics.trustScore}%` }} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${analysis.metrics.trustScore >= 80 ? 'bg-emerald-50 text-emerald-700' : analysis.metrics.trustScore >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {analysis.metrics.trustScore >= 80 ? 'High trust' : analysis.metrics.trustScore >= 60 ? 'Moderate trust' : 'Needs review'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {analysis.metrics.verifiedProjects} verified
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {analysis.metrics.flaggedProjects} flagged
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {analysis.metrics.trustScore >= 80 ? 'High reliability profile with strong delivery consistency.' : analysis.metrics.trustScore >= 60 ? 'Moderate confidence level with some follow-up needed.' : 'Needs closer monitoring and corrective action.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <BarChart3 className="h-4 w-4 text-brand-600" /> Project outcomes
                    </div>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {analysis.chartData.map((entry, index) => (
                              <Cell key={`${entry.name}-${index}`} fill={index === 0 ? '#2563eb' : index === 1 ? '#f59e0b' : '#94a3b8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <TrendingUp className="h-4 w-4 text-brand-600" /> Historical project overview
                    </div>
                    <div className="mt-4 space-y-3">
                      {filteredHistory.map((entry) => (
                        <div key={entry._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-dark-800">{entry.title}</p>
                            <p className="text-xs text-slate-500">{entry.lifecycleStatus}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-dark-800">{entry.completionScore}%</p>
                            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${entry.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : entry.status === 'Flagged' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <ShieldCheck className="h-4 w-4 text-brand-600" /> Work distribution
                    </div>
                    <div className="mt-4 grid gap-3">
                      {analysis.chartData.map((item) => (
                        <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{item.name}</span>
                            <span className="font-semibold text-dark-800">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <MessageSquareQuote className="h-4 w-4 text-brand-600" /> Citizen feedback remarks
                    </div>
                    <div className="mt-4 space-y-3">
                      {analysis.feedback.length === 0 ? (
                        <p className="text-sm text-slate-500">No citizen remarks available yet.</p>
                      ) : analysis.feedback.map((remark) => (
                        <div key={remark.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-dark-800">{remark.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{remark.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ContractorAnalysisPage;
