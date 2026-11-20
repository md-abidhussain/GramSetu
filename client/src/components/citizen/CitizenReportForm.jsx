import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Input, Textarea } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import GpsPicker from './GpsPicker.jsx';
import { getProjects } from '../../services/monitoringService.js';
import { submitCitizenReport } from '../../services/citizenService.js';
import { Camera, ShieldAlert, CheckCircle2 } from 'lucide-react';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const CitizenReportForm = ({ onSubmitSuccess }) => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [customProjectTitle, setCustomProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gps, setGps] = useState({ lat: '', lng: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [projectsError, setProjectsError] = useState(null);

  // Load verified/completed projects for citizen verification
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const list = await getProjects();
        const optionsList = list.map(p => ({ value: p._id, label: `${p.title} (${p.location?.address || 'No address'})` }));
        optionsList.push({ value: 'custom', label: 'Somewhere else (type the place name)' });
        setProjects(optionsList);
      } catch (err) {
        setProjectsError('The project list could not be loaded. You can still report a place by choosing "Somewhere else".');
        setProjects([{ value: 'custom', label: 'Somewhere else (type the place name)' }]);
      }
    };
    fetchProjects();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!PHOTO_TYPES.includes(file.type)) {
        setError('Please choose a JPG, PNG, WEBP or GIF photo.');
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError('That photo is larger than 5 MB. Please choose a smaller one.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(file);
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleGpsChange = (newGps) => {
    setGps(newGps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // a second click while submitting does nothing
    if (!projectId || !description.trim() || gps.lat === '' || gps.lng === '' || !image) {
      setError('Please choose a project, describe the problem, set the location and add a photo.');
      return;
    }
    if (projectId === 'custom' && !customProjectTitle.trim()) {
      setError('Please type the name of the place.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      if (projectId === 'custom') {
        formData.append('customProjectTitle', customProjectTitle);
      }
      formData.append('description', description);
      formData.append('lat', gps.lat);
      formData.append('lng', gps.lng);
      formData.append('image', image);

      const result = await submitCitizenReport(formData);
      setSuccess(true);
      
      // Reset form
      setProjectId('');
      setCustomProjectTitle('');
      setDescription('');
      setGps({ lat: '', lng: '' });
      setImage(null);
      setPreview(null);

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Your report could not be sent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-brand-900">
          <ShieldAlert className="h-5 w-5 text-accent-600" />
          <span>Report Infrastructure Damage</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {projectsError && (
            <div role="status" className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs font-medium">{projectsError}</div>
          )}

          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-red-900 text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>Report filed. Verification status is shown below.</span>
            </div>
          )}

          <Select
            label="Select Infrastructure Project"
            id="report-project"
            placeholder="Select a project location..."
            options={projects}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            disabled={loading}
          />

          {projectId === 'custom' && (
            <Input
              label="Custom Project Title / Name"
              id="report-custom-project"
              placeholder="e.g. Ward 4 High Street Road Reconstruction"
              value={customProjectTitle}
              onChange={(e) => setCustomProjectTitle(e.target.value)}
              required
              disabled={loading}
            />
          )}

          <Textarea
            label="Provide Description / Issue Details"
            id="report-desc"
            placeholder="e.g. The asphalt road has cracked near the main intersection, water leakage observed."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
            rows={3}
          />

          <GpsPicker
            lat={gps.lat}
            lng={gps.lng}
            onChange={handleGpsChange}
          />

          <div>
            <label htmlFor="report-photo" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Photo of the problem <span className="text-red-600" aria-hidden="true">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600 transition-colors rounded-xl p-5 text-center cursor-pointer bg-slate-50 relative h-32 flex flex-col justify-center items-center">
                <input
                  id="report-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  capture="environment"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                  aria-describedby="report-photo-help"
                />
                <Camera className="h-6 w-6 text-slate-600 mb-1" aria-hidden="true" />
                <span className="text-xs font-medium text-dark-800">Take or upload a photo</span>
                <span id="report-photo-help" className="text-xs text-slate-600">JPG, PNG, WEBP or GIF, up to 5 MB</span>
              </div>

              {preview ? (
                <div className="relative rounded-xl overflow-hidden h-32 border border-slate-200">
                  <img src={preview} alt="Citizen report preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-32 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 text-xs">
                  No image selected
                </div>
              )}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            Take the photo close enough that the problem fills much of the frame. The automated review
            identifies the type of problem; it does not measure physical size or depth, which an inspector
            confirms on site.
          </p>

          <Button
            type="submit"
            className="w-full py-2.5 flex items-center justify-center gap-1.5"
            loading={loading}
            disabled={loading}
          >
            <ShieldAlert className="h-4 w-4" />
            {loading ? 'Submitting Evidence...' : 'Submit Evidence for Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CitizenReportForm;
