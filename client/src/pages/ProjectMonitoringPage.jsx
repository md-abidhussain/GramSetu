import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout.jsx';
import BeforeAfterUpload from '../components/monitoring/BeforeAfterUpload.jsx';
import CompletionScoreCard from '../components/monitoring/CompletionScoreCard.jsx';
import ProjectHealthCard from '../components/monitoring/ProjectHealthCard.jsx';
import { useProjects } from '../hooks/useProjects.js';
import ProjectLifecycleSection from '../components/monitoring/ProjectLifecycleSection.jsx';
import ProjectImage from '../components/ui/ProjectImage.jsx';
import { Activity, MapPin, FileText } from 'lucide-react';
import { downloadFileBlob } from '../services/api.js';
import { SampleDataBadge } from '../components/ui/AiStatusNote.jsx';
import { clickable } from '../lib/a11y.js';

export const SAMPLE_PROJECT_ASSETS = {
  'PMGSY Rural Road Upgrade': {
    before: '/test-assets/project-1-road-before.jpg',
    after: '/test-assets/project-1-road-after.jpg'
  },
  'Government School Renovation': {
    before: '/test-assets/project-2-school-before.jpg',
    after: '/test-assets/project-2-school-after.jpg'
  },
  'Village Water Pipeline Network': {
    before: '/test-assets/project-3-pipeline-before.jpg',
    after: '/test-assets/project-3-pipeline-after.jpg'
  },
  'Primary Health Centre Construction': {
    before: '/test-assets/project-4-healthcentre-before.jpg',
    after: '/test-assets/project-4-healthcentre-after.jpg'
  },
  'Bridge Rehabilitation Project': {
    before: '/test-assets/project-5-bridge-before.jpg',
    after: '/test-assets/project-5-bridge-after.jpg'
  },
  'Smart Drainage Pavement Upgrade': {
    before: '/test-assets/project-6-drainage-before.jpg',
    after: '/test-assets/project-6-drainage-after.jpg'
  }
};

const UNRELATED_PATTERNS = [
  'photo-1515162305285', 'photo-1544982503', 'photo-1580582932', 'photo-1588072432',
  'photo-1542013936', 'photo-1584267326', 'photo-1586528116', 'photo-1519494026', 'photo-1545624446'
];

export const resolveProjectImages = (project) => {
  if (!project) return { before: null, after: null };
  const sample = SAMPLE_PROJECT_ASSETS[project.title];
  const isUnrelated = (url) => typeof url === 'string' && UNRELATED_PATTERNS.some((p) => url.includes(p));

  const before = isUnrelated(project.beforeImageUrl)
    ? sample?.before || null
    : project.beforeImageUrl || (sample?.before || null);

  const after = isUnrelated(project.afterImageUrl)
    ? sample?.after || null
    : project.afterImageUrl;

  return { before, after };
};

export const ProjectMonitoringPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('id');
  const { projects, loading, error, addNewProject, completeExistingProject, refetchProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState(null);

  // Sync selection with URL and projects array
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    if (requestedId) {
      const match = projects.find((p) => p._id === requestedId);
      if (match) {
        setSelectedProject(match);
        return;
      }
    }
    // Default to existing selected or first project in list
    setSelectedProject((prev) => {
      if (prev) {
        const stillExists = projects.find((p) => p._id === prev._id);
        if (stillExists) return stillExists;
      }
      return projects[0];
    });
  }, [projects, requestedId]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setSearchParams({ id: project._id });
  };

  const handleCreated = async (formData) => {
    const result = await addNewProject(formData);
    setSelectedProject(result);
    if (result?._id) setSearchParams({ id: result._id });
  };

  const handleCompleted = async (id, formData) => {
    const result = await completeExistingProject(id, formData);
    setSelectedProject(result);
  };

  return (
    <PageLayout title="Projects">
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
            
            {error && projects.length === 0 ? (
              <div role="alert" className="py-4 text-sm text-rose-800">
                {error}{' '}
                <button type="button" onClick={refetchProjects} className="font-semibold underline focus:outline-none focus:ring-2 focus:ring-brand-600">Try again</button>
              </div>
            ) : loading && projects.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">Loading projects…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">No projects yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {projects.map((item) => (
                  <div
                    key={item._id}
                    {...clickable(() => handleSelectProject(item))}
                    aria-pressed={selectedProject?._id === item._id}
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
                        {item.riskLevel ? `Risk: ${item.riskLevel}` : 'Risk: not assessed'}
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
                  <h3 className="text-base font-bold text-dark-800 leading-tight flex items-center gap-2">{selectedProject.title} <SampleDataBadge record={selectedProject} /></h3>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {selectedProject.location.address || 'N/A'} (GPS: {selectedProject.location.lat}, {selectedProject.location.lng})
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => downloadFileBlob(`/projects/${selectedProject._id}/report`, `audit-report-${selectedProject._id}.pdf`)}
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
                  assessment={selectedProject.aiAssessment}
                  isSampleData={selectedProject.dataSource === 'sample'}
                />
                <ProjectHealthCard
                  health={selectedProject.projectHealth}
                  notes={selectedProject.aiComparisonNotes}
                />
              </div>

              <ProjectLifecycleSection
                projectId={selectedProject._id}
                project={selectedProject}
                onProjectUpdated={(updated) => { setSelectedProject(updated); refetchProjects(); }}
              />

              {/* Image Comparison Box */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h4 className="text-xs font-semibold text-slate-600 mb-3">Audit Photographic Ledger</h4>
                
                {(() => {
                  const { before: resolvedBefore, after: resolvedAfter } = resolveProjectImages(selectedProject);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Before */}
                      <div>
                        <span className="block text-xs text-slate-600 font-bold mb-2">Before construction</span>
                        <ProjectImage
                          src={resolvedBefore}
                          alt={`Before construction - ${selectedProject.title}`}
                          label="Initial site inspection"
                        />
                      </div>

                      {/* After */}
                      <div>
                        <span className="block text-xs text-slate-600 font-bold mb-2">Verified Completion</span>
                        <ProjectImage
                          src={resolvedAfter}
                          alt={`Verified completion - ${selectedProject.title}`}
                          label="Post-build audit"
                        />
                      </div>
                    </div>
                  );
                })()}
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
