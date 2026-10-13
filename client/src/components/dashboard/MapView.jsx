import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, TrendingUp, UserCheck, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react';

// Create styled circular divIcons
const createMarkerIcon = (project) => {
  let color = '#f59e0b'; // Pending / Under Review -> Yellow

  // Green: Verified / Approved and Health is high
  if (project.status === 'Verified' && project.lifecycleStatus === 'Approved') {
    color = '#10b981';
  } 
  // Red: Flagged or Maintenance Required or low health
  else if (project.status === 'Flagged' || project.lifecycleStatus === 'Maintenance Required' || (project.healthPercentage !== undefined && project.healthPercentage < 50)) {
    color = '#ef4444';
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="inline-flex rounded-full h-4.5 w-4.5 border-2 border-white shadow-md" style="background-color: ${color}"></span>
      </div>
    `,
    className: 'custom-map-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

export const MapView = ({ mapData = [] }) => {
  const defaultCenter = [25.5941, 81.3889]; // Central UP (Lucknow/Prayagraj/Varanasi region)
  const [center, setCenter] = useState(defaultCenter);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    // If we have projects with coordinates, center on the first one
    const firstWithLocation = mapData.find(item => 
      item.location && 
      typeof item.location.lat === 'number' && 
      typeof item.location.lng === 'number'
    );
    if (firstWithLocation) {
      setCenter([firstWithLocation.location.lat, firstWithLocation.location.lng]);
    }
  }, [mapData]);

  const validPoints = mapData.filter(item => 
    item.location && 
    typeof item.location.lat === 'number' && 
    typeof item.location.lng === 'number' && 
    !isNaN(item.location.lat) && 
    !isNaN(item.location.lng)
  );

  return (
    <Card className="h-[380px] col-span-full md:col-span-1 lg:col-span-2 relative">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle className="text-base font-bold">Geospatial Project Tracker</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Plotting regional infrastructure coordinates, health metrics, and audit states</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending / Review</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Maintenance / Flagged</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[295px] p-0 overflow-hidden relative">
        <div className="h-full w-full">
          <MapContainer 
            key={`${center[0]}-${center[1]}`}
            center={center} 
            zoom={8} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validPoints.map((proj) => (
              <Marker 
                key={proj._id} 
                position={[proj.location.lat, proj.location.lng]} 
                icon={createMarkerIcon(proj)}
                eventHandlers={{
                  click: () => {
                    setSelectedProject(proj);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs max-w-[180px]">
                    <h4 className="font-bold text-dark-800 text-xs leading-tight">{proj.title}</h4>
                    <p className="text-[9px] text-slate-400 mt-1">{proj.location.address}</p>
                    <button 
                      onClick={() => setSelectedProject(proj)}
                      className="mt-2 w-full bg-brand-600 hover:bg-brand-700 text-white text-[9px] font-bold py-1 rounded shadow"
                    >
                      Inspect Audit Profile
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Detailed Project Marker Overlay Modal */}
        {selectedProject && (
          <div className="absolute inset-0 bg-slate-900/50 z-20 flex items-center justify-center p-3 animate-fadeIn">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90%] text-xs">
              
              <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Geospatial Audit Profile</span>
                  <h4 className="font-bold text-xs mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-rose-500" /> {selectedProject.title}
                  </h4>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
                
                {/* Visual score pills */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 border border-slate-100 rounded p-2">
                    <span className="block text-[8px] font-semibold text-slate-400 uppercase">Health</span>
                    <span className={`text-xs font-bold block mt-0.5 ${
                      selectedProject.healthPercentage >= 80 ? 'text-emerald-600' : selectedProject.healthPercentage >= 50 ? 'text-amber-500' : 'text-rose-600'
                    }`}>
                      {selectedProject.healthPercentage}%
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded p-2">
                    <span className="block text-[8px] font-semibold text-slate-400 uppercase">Completion</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {selectedProject.completionScore !== null && selectedProject.completionScore !== undefined 
                        ? `${selectedProject.completionScore}%` 
                        : 'Unverified'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded p-2">
                    <span className="block text-[8px] font-semibold text-slate-400 uppercase">Risk Level</span>
                    <span className={`text-xs font-bold block mt-0.5 ${
                      selectedProject.riskLevel === 'Low' ? 'text-emerald-600' : selectedProject.riskLevel === 'Medium' ? 'text-amber-500' : 'text-rose-600'
                    }`}>
                      {selectedProject.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Contractor:</span>
                    <span className="font-semibold text-dark-800">{selectedProject.contractor?.name || 'N/A'}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Contractor AI Trust:</span>
                    <span className="font-semibold text-emerald-600">{selectedProject.contractor?.trustScore || 85}%</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Lifecycle Status:</span>
                    <span className="font-semibold text-brand-700">{selectedProject.lifecycleStatus}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Citizen Complaints:</span>
                    <span className="font-semibold text-rose-700">{selectedProject.complaintCount || 0} File(s)</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Location Address:</span>
                    <span className="font-medium text-slate-600 text-[10px] text-right truncate max-w-[200px]">{selectedProject.location.address}</span>
                  </p>
                </div>

                {/* AI Summary comparison notes */}
                <div className="border-t border-slate-100 pt-3 bg-brand-50/10 p-2.5 rounded border border-brand-100/30">
                  <span className="block text-[8px] font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> AI Audit Summary & Notes
                  </span>
                  <p className="text-slate-700 leading-relaxed text-[10px]">
                    {selectedProject.aiComparisonNotes || 'AI comparison audit pending completion file uploads. Roadway is currently monitored under project created lifecycle state.'}
                  </p>
                </div>

              </div>

              <div className="bg-slate-50 p-2 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-3 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default MapView;
