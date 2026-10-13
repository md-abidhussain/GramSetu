import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Search, CheckCircle, AlertTriangle, AlertCircle, Clock3 } from 'lucide-react';
import RiskBadge from '../tender/RiskBadge.jsx';

export const ProjectsTable = ({ projects = [], onSelectProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="h-3 w-3" /> Verified
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-rose-50 text-rose-700 border border-rose-100">
            <AlertCircle className="h-3 w-3" /> Flagged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <AlertTriangle className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  const filteredProjects = projects.filter((project) => {
    const searchString = `${project.title} ${project.contractor?.name || ''} ${project.location?.address || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || project.status === statusFilter;
    const matchesRisk = riskFilter === '' || project.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-3">
          <div>
            <CardTitle>Infrastructure Project Ledger</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">List of audited infrastructure works and AI inspection metrics</p>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="relative w-48">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-4 py-2 text-xs transition-colors focus:outline-none focus:border-brand-500 text-dark-800 placeholder-slate-400"
              />
            </div>

            <Select
              id="filter-status"
              placeholder="All Statuses"
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Verified', label: 'Verified' },
                { value: 'Flagged', label: 'Flagged' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="!py-1.5 !px-3 !text-xs !bg-white border-slate-200 w-36"
            />

            <Select
              id="filter-risk"
              placeholder="All Risks"
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' }
              ]}
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="!py-1.5 !px-3 !text-xs !bg-white border-slate-200 w-32"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-y border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Project Details</th>
                <th className="px-6 py-3.5">Contractor</th>
                <th className="px-6 py-3.5 text-center">Lifecycle</th>
                <th className="px-6 py-3.5">Risk Rating</th>
                <th className="px-6 py-3.5">Audit Status</th>
                <th className="px-6 py-3.5">Audit Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 bg-white">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-medium bg-slate-50/20">
                    No infrastructure projects matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => (
                  <tr
                    key={proj._id}
                    onClick={() => onSelectProject && onSelectProject(proj)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4.5">
                      <p className="font-semibold text-dark-800 group-hover:text-brand-600 transition-colors">{proj.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{proj.location.address}</p>
                    </td>
                    <td className="px-6 py-4.5">
                      <p className="font-medium text-dark-800">{proj.contractor?.name || 'N/A'}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">ID: {proj.contractor?.registrationId || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-semibold">{proj.lifecycleStatus || 'Project Created'}</span>
                        {proj.completionScore !== undefined ? (
                          <span className={`inline-flex font-bold text-sm ${
                            proj.completionScore >= 80 ? 'text-emerald-600' : proj.completionScore >= 50 ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {proj.completionScore}%
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Unverified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <RiskBadge level={proj.riskLevel || 'Low'} />
                    </td>
                    <td className="px-6 py-4.5">
                      {getStatusBadge(proj.status)}
                    </td>
                    <td className="px-6 py-4.5 text-slate-400">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsTable;
