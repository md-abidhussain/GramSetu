import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input.jsx';

// Roughly central Uttar Pradesh, so the map opens somewhere recognisable
// before a location is chosen.
const FALLBACK_CENTRE = [25.5941, 81.3889];

const pinIcon = L.divIcon({
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#dc2626;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Tells the person what to do about it, rather than one message for every cause.
const describeLocationError = (error) => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location access was blocked. Allow it in your browser, or tap the map to place the pin.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your device could not work out where it is. Tap the map to place the pin.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Finding your location took too long. Try again, or tap the map to place the pin.';
  }
  return 'Could not get your location. Tap the map to place the pin.';
};

const PlacePinOnClick = ({ onPick }) => {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng)
  });
  return null;
};

// Recentres only when the browser reports a location. Recentring on every
// change would yank the map away while someone is dragging the pin.
const FollowFoundLocation = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16);
  }, [target, map]);
  return null;
};

export const GpsPicker = ({ lat, lng, onChange }) => {
  const [finding, setFinding] = useState(false);
  const [foundLocation, setFoundLocation] = useState(null);
  const [error, setError] = useState(null);

  const hasPosition = lat !== '' && lng !== '' && !isNaN(lat) && !isNaN(lng);
  const position = hasPosition ? [Number(lat), Number(lng)] : null;

  const pick = (nextLat, nextLng) => {
    setError(null);
    onChange({ lat: nextLat.toFixed(6), lng: nextLng.toFixed(6) });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser cannot find your location. Tap the map to place the pin.');
      return;
    }
    setFinding(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (found) => {
        pick(found.coords.latitude, found.coords.longitude);
        setFoundLocation([found.coords.latitude, found.coords.longitude]);
        setFinding(false);
      },
      (failure) => {
        setError(describeLocationError(failure));
        setFinding(false);
      },
      // Laptops locate by wifi and are slower than phones.
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          Where is it? <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={finding}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-60"
        >
          <Navigation className={`h-4 w-4 ${finding ? 'animate-spin' : ''}`} />
          {finding ? 'Finding you...' : 'Use my location'}
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Tap the map to place a pin, or use your location.
      </p>

      {error && (
        <div className="flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="h-56 overflow-hidden rounded-lg border border-slate-200">
        <MapContainer
          center={position || FALLBACK_CENTRE}
          zoom={position ? 15 : 7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <PlacePinOnClick onPick={pick} />
          <FollowFoundLocation target={foundLocation} />
          {position && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const moved = event.target.getLatLng();
                  pick(moved.lat, moved.lng);
                }
              }}
            />
          )}
        </MapContainer>
      </div>

      <details className="text-sm text-slate-500">
        <summary className="cursor-pointer select-none">Enter coordinates instead</summary>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <Input
            type="number"
            step="any"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => onChange({ lat: e.target.value, lng })}
            required
          />
          <Input
            type="number"
            step="any"
            placeholder="Longitude"
            value={lng}
            onChange={(e) => onChange({ lat, lng: e.target.value })}
            required
          />
        </div>
      </details>
    </div>
  );
};

export default GpsPicker;
