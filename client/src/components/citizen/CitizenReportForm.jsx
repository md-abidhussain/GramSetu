import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Input, Textarea } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import GpsPicker from './GpsPicker.jsx';
import { getProjects } from '../../services/monitoringService.js';
import { submitCitizenReport } from '../../services/citizenService.js';
import { Camera, ShieldAlert, CheckCircle2, Ruler } from 'lucide-react';

export const CitizenReportForm = ({ onSubmitSuccess }) => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [customProjectTitle, setCustomProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gps, setGps] = useState({ lat: '', lng: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [referenceScaleCmPerPixel, setReferenceScaleCmPerPixel] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load verified/completed projects for citizen verification
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const list = await getProjects();
        // Allow citizens to report on any project, but particularly completed/verified ones
        const optionsList = list.map(p => ({ value: p._id, label: `${p.title} (${p.location.address || 'No Address'})` }));
        optionsList.push({ value: 'custom', label: 'Other / Custom Project (Enter details manually)...' });
        setProjects(optionsList);
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    fetchProjects();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
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
    if (!projectId || !description || !gps.lat || !gps.lng || !image || !Number(referenceScaleCmPerPixel) || Number(referenceScaleCmPerPixel) <= 0) {
      setError('All fields, GPS coordinates, an image, and a positive reference scale are required');
      return;
    }
    if (projectId === 'custom' && !customProjectTitle) {
      setError('Please provide a custom project title');
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
      if (referenceScaleCmPerPixel) formData.append('referenceScaleCmPerPixel', referenceScaleCmPerPixel);

      const result = await submitCitizenReport(formData);
      setSuccess(true);
      
      // Reset form
      setProjectId('');
      setCustomProjectTitle('');
      setDescription('');
      setGps({ lat: '', lng: '' });
      setImage(null);
      setPreview(null);
      setReferenceScaleCmPerPixel('');

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit citizen report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <span className="text-xs text-brand-600 font-bold">Citizen Verification Portal</span>
          <CardTitle className="text-lg mt-0.5 flex items-center gap-1">
            <ShieldAlert className="h-4.5 w-4.5 text-brand-600" /> Report Infrastructure Damage
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4" />
              <span>Report filed successfully! Scroll down to view the AI analysis.</span>
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Infrastructure Photo (Current State) <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 transition-colors rounded-xl p-5 text-center cursor-pointer bg-slate-50 relative h-32 flex flex-col justify-center items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <Camera className="h-6 w-6 text-slate-600 mb-1" />
                <span className="text-xs font-medium text-dark-800">Snap or Upload photo</span>
                <span className="text-xs text-slate-600">PNG, JPG up to 5MB</span>
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

          <div className="rounded-md border border-brand-100 bg-brand-50/10 p-3.5">
            <label htmlFor="reference-scale" className="flex items-center gap-1.5 text-xs font-semibold text-dark-800">
              <Ruler className="h-3.5 w-3.5 text-brand-700" /> Reference scale (cm per pixel) <span className="text-red-500">*</span>
            </label>
            <input
              id="reference-scale"
              type="number"
              min="0.001"
              step="0.001"
              value={referenceScaleCmPerPixel}
              onChange={(e) => setReferenceScaleCmPerPixel(e.target.value)}
              disabled={loading}
              placeholder="e.g. 0.25"
              required
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Place a known-size marker beside the defect and enter its calibrated centimetres-per-pixel value. Calibrated measurements are required for each submitted report.
            </p>
          </div>

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
