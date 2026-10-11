import React, { useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

// Tells the person what to actually do, instead of one message for every cause.
const describeLocationError = (error) => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location access was blocked. Allow it in your browser, or type the coordinates below.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your device could not determine a location. Please type the coordinates below.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Finding your location took too long. Try again, or type the coordinates below.';
  }
  return 'Could not get your location. Please type the coordinates below.';
};

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
        setGeoError(describeLocationError(error));
        setGeoLoading(false);
      },
      // Laptops locate by wifi and are slower than phones, so allow longer
      // than the usual few seconds before giving up.
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Location <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={getGeoLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors"
        >
          <Navigation className={`h-3 w-3 ${geoLoading ? 'animate-spin' : ''}`} />
          {geoLoading ? 'Finding you...' : 'Use my location'}
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
