import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create styled circular divIcons to prevent Leaflet asset path errors
const createMarkerIcon = (status) => {
  let color = '#f59e0b'; // pending -> amber
  if (status === 'Verified') color = '#10b981'; // verified -> green
  if (status === 'Flagged') color = '#ef4444'; // flagged -> red

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-4 w-4 rounded-full opacity-60" style="background-color: ${color}"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white shadow-md" style="background-color: ${color}"></span>
      </div>
    `,
    className: 'custom-map-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export const MapView = ({ mapData = [] }) => {
  const defaultCenter = [20.5937, 78.9629]; // Default to India center
  const [center, setCenter] = React.useState(defaultCenter);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Geolocation access declined or unavailable, centering on projects/default.');
          if (mapData.length > 0 && mapData[0].location?.lat && mapData[0].location?.lng) {
            setCenter([mapData[0].location.lat, mapData[0].location.lng]);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      if (mapData.length > 0 && mapData[0].location?.lat && mapData[0].location?.lng) {
        setCenter([mapData[0].location.lat, mapData[0].location.lng]);
      }
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
    <Card className="h-[340px] col-span-full md:col-span-1 lg:col-span-2">
      <CardHeader>
        <div>
          <CardTitle>Geospatial Project Tracker</CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">Plotting infrastructure coordinates and real-time status ledger</p>
        </div>
      </CardHeader>

      <CardContent className="h-64 p-0 overflow-hidden relative">
        <div className="h-full w-full">
          <MapContainer 
            key={`${center[0]}-${center[1]}`}
            center={center} 
            zoom={center === defaultCenter ? 5 : 12} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validPoints.map((proj) => (
              <Marker 
                key={proj._id} 
                position={[proj.location.lat, proj.location.lng]} 
                icon={createMarkerIcon(proj.status)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <h4 className="font-bold text-dark-800 text-[13px] leading-tight mb-1">{proj.title}</h4>
                    <p className="text-[10px] text-slate-500 mb-2 leading-snug">{proj.location.address || 'No registered address'}</p>
                    <div className="flex items-center justify-between gap-4 mt-2 border-t border-slate-50 pt-1.5">
                      <span className="font-semibold text-slate-400">Score: {proj.completionScore !== undefined ? `${proj.completionScore}%` : 'N/A'}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase ${
                        proj.status === 'Verified' ? 'bg-emerald-500' : proj.status === 'Flagged' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapView;
