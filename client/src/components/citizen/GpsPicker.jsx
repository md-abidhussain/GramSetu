import React, { useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export const GpsPicker = ({ lat, lng, onChange }) => {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const getGeoLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        });
        setGeoLoading(false);
      },
      (error) => {
        console.error('Error fetching position', error);
        setGeoError('Could not fetch GPS coordinates. Please enter manually.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          GPS Coordinates <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={getGeoLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors"
        >
          <Navigation className={`h-3 w-3 ${geoLoading ? 'animate-spin' : ''}`} />
          {geoLoading ? 'Acquiring GPS...' : 'Use Current Location'}
        </button>
      </div>

      {geoError && (
        <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>{geoError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
};

export default GpsPicker;
