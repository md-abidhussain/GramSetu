import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout.jsx';
import BeforeAfterUpload from '../components/monitoring/BeforeAfterUpload.jsx';
import CompletionScoreCard from '../components/monitoring/CompletionScoreCard.jsx';
import ProjectHealthCard from '../components/monitoring/ProjectHealthCard.jsx';
import { useProjects } from '../hooks/useProjects.js';
import ProjectLifecycleSection from '../components/monitoring/ProjectLifecycleSection.jsx';
import { Eye, Activity, MapPin, FileText } from 'lucide-react';

export const ProjectMonitoringPage = () => {
  const { projects, loading, addNewProject, completeExistingProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState(null);

  const handleCreated = async (formData) => {
    const result = await addNewProject(formData);
    setSelectedProject(result);
  };

  const handleCompleted = async (id, formData) => {
    const result = await completeExistingProject(id, formData);
    setSelectedProject(result);
  };

  return (
    <PageLayout title="Government Project Monitoring">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & History List */}
        <div className="lg:col-span-4 space-y-6">
          <BeforeAfterUpload
            projects={projects}
            onProjectCreated={handleCreated}
            onProjectCompleted={handleCompleted}
          />

          {/* Project List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-xs text-slate-600 mb-3.5 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-slate-600" /> Infrastructure Projects
            </h3>
            
            {loading && projects.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Loading project ledger...</p>
            ) : projects.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No projects registered yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {projects.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedProject(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedProject?._id === item._id
                        ? 'border-brand-500 bg-brand-50/15 font-medium'
                        : 'border-slate-50 hover:border-slate-100 bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-dark-800 font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{item.location.address || 'No Address'}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Flagged' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.lifecycleStatus || 'Project Created'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {item.riskLevel || 'Low'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Comparison & Stats */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Title & Metadata */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-dark-800 leading-tight">{selectedProject.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {selectedProject.location.address || 'N/A'} (GPS: {selectedProject.location.lat}, {selectedProject.location.lng})
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => window.open(`/api/projects/${selectedProject._id}/report`, '_blank')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-600" /> Export Audit PDF
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-slate-600 font-bold block">Contractor</span>
                    <span className="text-xs font-semibold text-dark-800">{selectedProject.contractor?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Grid with Score & Health cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CompletionScoreCard
                  score={selectedProject.completionScore}
                  status={selectedProject.status}
                />
                <ProjectHealthCard
                  health={selectedProject.projectHealth}
                  notes={selectedProject.aiComparisonNotes}
                />
              </div>

              <ProjectLifecycleSection projectId={selectedProject._id} project={selectedProject} />

              {/* Image Comparison Box */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h4 className="text-xs font-semibold text-slate-600 mb-3">Audit Photographic Ledger</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div>
                    <span className="block text-xs text-slate-600 font-bold mb-2">Before construction</span>
                    <a href={selectedProject.beforeImageUrl} target="_blank" rel="noreferrer" className="block relative h-48 rounded-xl overflow-hidden border border-slate-200 hover:opacity-95 transition-opacity">
                      <img src={selectedProject.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-dark-900/60 text-white font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Zoom
                      </span>
                    </a>
                  </div>

                  {/* After */}
                  <div>
                    <span className="block text-xs text-slate-600 font-bold mb-2">Verified Completion</span>
                    {selectedProject.afterImageUrl ? (
                      <a href={selectedProject.afterImageUrl} target="_blank" rel="noreferrer" className="block relative h-48 rounded-xl overflow-hidden border border-slate-200 hover:opacity-95 transition-opacity">
                        <img src={selectedProject.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 bg-dark-900/60 text-white font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Zoom
                        </span>
                      </a>
                    ) : (
                      <div className="h-48 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-200">
                        <Activity className="h-8 w-8 text-slate-300 mb-1" />
                        <span className="text-xs font-semibold text-dark-800">Awaiting Completion Upload</span>
                        <span className="text-xs text-slate-600 mt-0.5">Use the upload panel to file post-build audit</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-600 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
              <Activity className="h-12 w-12 text-slate-200 mb-2.5 animate-pulse" />
              <h4 className="font-semibold text-sm text-dark-800">Awaiting Project Selection</h4>
              <p className="text-xs max-w-xs mt-1 leading-normal">
                Initialize a project or complete one using the side panel, or select an existing project in the ledger to review verification details.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ProjectMonitoringPage;
