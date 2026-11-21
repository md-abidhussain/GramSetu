import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Select.jsx';
import { getContractorAnalysis, getContractors } from '../services/contractorService.js';
import { BarChart3, TrendingUp, ShieldCheck, MessageSquareQuote, Filter, AlertCircle, Building2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { resolveContractorProfile } from '../data/contractorProfiles.js';

export const ContractorAnalysisPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('id');

  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState(requestedId || '');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadContractors = async () => {
      try {
        const data = await getContractors();
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setContractors(list);
        if (list.length > 0) {
          if (requestedId && list.some((c) => c._id === requestedId)) {
            setSelectedContractor(requestedId);
          } else {
            const defaultId = list[0]._id;
            setSelectedContractor(defaultId);
            setSearchParams({ id: defaultId }, { replace: true });
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError('Unable to load contractor directory.');
      }
    };

    loadContractors();
    return () => {
      isMounted = false;
    };
  }, [requestedId, setSearchParams]);

  useEffect(() => {
    if (!selectedContractor) return;

    const loadAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getContractorAnalysis(selectedContractor);
        setAnalysis(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unable to load performance record for the selected contractor.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [selectedContractor]);

  const handleContractorChange = (newId) => {
    setSelectedContractor(newId);
    setSearchParams({ id: newId });
  };

  const resolvedContractor = useMemo(() => {
    return resolveContractorProfile(analysis?.contractor);
  }, [analysis?.contractor]);

  const resolvedHistory = useMemo(() => {
    if (!analysis) return [];
    if (analysis.history && analysis.history.length > 0) return analysis.history;
    return resolvedContractor?._fallbackProjects || [];
  }, [analysis, resolvedContractor]);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return resolvedHistory;
    return resolvedHistory.filter((entry) => entry.status === filter);
  }, [resolvedHistory, filter]);

  const resolvedFeedback = useMemo(() => {
    if (!analysis) return [];
    if (analysis.feedback && analysis.feedback.length > 0) return analysis.feedback;
    return resolvedContractor?._fallbackFeedback || [];
  }, [analysis, resolvedContractor]);

  const resolvedChartData = useMemo(() => {
    if (analysis?.chartData && analysis.chartData.some((d) => d.value > 0)) {
      return analysis.chartData;
    }
    const verified = resolvedHistory.filter((p) => p.status === 'Verified').length;
    const flagged = resolvedHistory.filter((p) => p.status === 'Flagged').length;
    const pending = resolvedHistory.filter((p) => p.status === 'Pending').length;
    return [
      { name: 'Verified', value: verified },
      { name: 'Flagged', value: flagged },
      { name: 'Pending', value: pending }
    ];
  }, [analysis?.chartData, resolvedHistory]);

  const resolvedAverageScore = useMemo(() => {
    if (!analysis?.metrics) return null;
    if (analysis.metrics.averageCompletionScore !== null) {
      return analysis.metrics.averageCompletionScore;
    }
    const scored = resolvedHistory.filter((p) => typeof p.completionScore === 'number');
    if (scored.length > 0) {
      return Math.round(scored.reduce((sum, p) => sum + p.completionScore, 0) / scored.length);
    }
    return resolvedContractor?.performanceScore || null;
  }, [analysis?.metrics, resolvedHistory, resolvedContractor]);

  return (
    <PageLayout title="Contractor record">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4.5 w-4.5 text-brand-600" /> Contractor record
                </CardTitle>
                <p className="mt-1 text-sm text-slate-600">Their past projects, what the public reported, and how their score moved</p>
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
                  onChange={(event) => handleContractorChange(event.target.value)}
                  className="min-w-[220px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div role="alert" className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {loading ? (
              <p className="text-sm text-slate-600">Loading…</p>
            ) : !analysis?.metrics ? (
              <p className="text-sm text-slate-600">
                Choose a contractor to see their record.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Selected Contractor Header Card */}
                {resolvedContractor && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-brand-600" />
                        <h2 className="text-base font-bold text-dark-800">{resolvedContractor.name}</h2>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Registration ID: <span className="font-semibold text-slate-700">{resolvedContractor.registrationId}</span>
                        {resolvedContractor.expertise && (
                          <> • Specialization: <span className="font-semibold text-slate-700">{resolvedContractor.expertise}</span></>
                        )}
                        {resolvedContractor.address && (
                          <> • Location: <span className="font-semibold text-slate-700">{resolvedContractor.address}</span></>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {resolvedContractor.contactPerson && (
                        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 font-medium">
                          Rep: {resolvedContractor.contactPerson}
                        </span>
                      )}
                      {resolvedContractor.contactEmail && (
                        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                          {resolvedContractor.contactEmail}
                        </span>
                      )}
                      {resolvedContractor.phone && (
                        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                          {resolvedContractor.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">Projects</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{Math.max(analysis.metrics.totalProjects, resolvedHistory.length)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">Average AI completion score</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{resolvedAverageScore === null ? 'No data' : `${resolvedAverageScore}%`}</p>
                      <p className="text-xs text-slate-600">{Math.max(analysis.metrics.aiAssessedProjects, resolvedHistory.filter(p => typeof p.completionScore === 'number').length)} AI-compared</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">Verified complaints</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{analysis.metrics.acceptedComplaints}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">Trust score</p>
                      <p className="mt-2 text-2xl font-semibold text-dark-800">{analysis.metrics.trustScore}/100</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-5">
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
                        {resolvedHistory.filter(p => p.status === 'Verified').length} verified
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {resolvedHistory.filter(p => p.status === 'Flagged').length} flagged
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Trust score = performance (average of real AI completion scores, or the registered baseline if none) minus 8 per verified complaint, minus 5 per flagged project. See docs/ARCHITECTURE.md.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <BarChart3 className="h-4 w-4 text-brand-600" /> Project outcomes
                    </div>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={resolvedChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {resolvedChartData.map((entry, index) => (
                              <Cell key={`${entry.name}-${index}`} fill={index === 0 ? '#2563eb' : index === 1 ? '#f59e0b' : '#94a3b8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <TrendingUp className="h-4 w-4 text-brand-600" /> Historical project overview
                    </div>
                    <div className="mt-4 space-y-3">
                      {filteredHistory.map((entry) => (
                        <div key={entry._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-dark-800">{entry.title}</p>
                            <p className="text-sm text-slate-600">{entry.lifecycleStatus}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-dark-800">{typeof entry.completionScore === 'number' ? `${entry.completionScore}%` : 'Not scored'}</p>
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
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <ShieldCheck className="h-4 w-4 text-brand-600" /> Work distribution
                    </div>
                    <div className="mt-4 grid gap-3">
                      {resolvedChartData.map((item) => (
                        <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{item.name}</span>
                            <span className="font-semibold text-dark-800">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                      <MessageSquareQuote className="h-4 w-4 text-brand-600" /> Citizen feedback remarks
                    </div>
                    <div className="mt-4 space-y-3">
                      {resolvedFeedback.length === 0 ? (
                        <p className="text-sm text-slate-500">No citizen remarks available yet.</p>
                      ) : resolvedFeedback.map((remark) => (
                        <div key={remark.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-dark-800">{remark.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{remark.summary}</p>
                        </div>
                      ))}
                    </div>
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
