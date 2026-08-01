import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { getTenders } from '../../services/tenderService.js';
import { Camera, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const BeforeAfterUpload = ({ projects, onProjectCreated, onProjectCompleted }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'complete'
  
  // Create Project state
  const [title, setTitle] = useState('');
  const [tenderId, setTenderId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [beforeImage, setBeforeImage] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);

  // Complete Project state
  const [completeProjectId, setCompleteProjectId] = useState('');
  const [afterImage, setAfterImage] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load tenders for selection
  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const list = await getTenders();
        setTenders(list.map(t => ({ value: t._id, label: t.title })));
      } catch (err) {
        console.error('Failed to load tenders', err);
      }
    };
    fetchTenders();
  }, []);

  const handleImageChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'before') {
          setBeforeImage(file);
          setBeforePreview(reader.result);
        } else {
          setAfterImage(file);
          setAfterPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title || !tenderId || !lat || !lng || !beforeImage) {
      setError('All fields and a "before" image are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('tenderId', tenderId);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('address', address);
      formData.append('image', beforeImage);

      const newProj = await onProjectCreated(formData);
      // Reset form
      setTitle('');
      setTenderId('');
      setLat('');
      setLng('');
      setAddress('');
      setBeforeImage(null);
      setBeforePreview(null);
    } catch (err) {
      setError(err.message || 'Failed to initialize project');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeProjectId || !afterImage) {
      setError('Project selection and an "after" image are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', afterImage);

      await onProjectCompleted(completeProjectId, formData);
      // Reset form
      setCompleteProjectId('');
      setAfterImage(null);
      setAfterPreview(null);
    } catch (err) {
      setError(err.message || 'Failed to complete project and analyze');
    } finally {
      setLoading(false);
    }
  };

  const pendingProjects = projects.filter(p => !p.afterImageUrl);

  return (
    <Card>
      <CardHeader className="pb-0 border-b-0">
        <div className="flex border-b border-slate-200 w-full">
          <button
            onClick={() => { setActiveTab('create'); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === 'create'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            1. Initialize Project
          </button>
          <button
            onClick={() => { setActiveTab('complete'); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
              activeTab === 'complete'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            2. Upload Completion
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-sm flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              label="Project Title"
              id="project-title"
              placeholder="e.g. Sector-4 Asphalt Overlay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />

            <Select
              label="Link to Tender"
              id="project-tender"
              placeholder="Select associated tender..."
              options={tenders}
              value={tenderId}
              onChange={(e) => setTenderId(e.target.value)}
              required
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                id="project-lat"
                placeholder="e.g. 26.8467"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                label="Longitude"
                id="project-lng"
                placeholder="e.g. 80.9462"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Input
              label="Location Address"
              id="project-address"
              placeholder="e.g. Gosainganj, Lucknow Rural"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Before Construction Photo <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 transition-colors rounded-md p-5 text-center cursor-pointer bg-white hover:bg-slate-50/50 relative h-32 flex flex-col justify-center items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'before')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <Camera className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-dark-800">Choose Image</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                </div>
                
                {beforePreview ? (
                  <div className="relative rounded-md overflow-hidden h-32 border border-slate-200">
                    <img src={beforePreview} alt="Before preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 text-xs">
                    No image selected
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5" loading={loading} disabled={loading}>
              Initialize Project Ledger
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <Select
              label="Select Pending Project"
              id="complete-project-select"
              placeholder="Select project..."
              options={pendingProjects.map(p => ({ value: p._id, label: p.title }))}
              value={completeProjectId}
              onChange={(e) => setCompleteProjectId(e.target.value)}
              required
              disabled={loading}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Completed Project Photo <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 transition-colors rounded-md p-5 text-center cursor-pointer bg-white hover:bg-slate-50/50 relative h-32 flex flex-col justify-center items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'after')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <Camera className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-dark-800">Choose Image</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                </div>

                {afterPreview ? (
                  <div className="relative rounded-md overflow-hidden h-32 border border-slate-200">
                    <img src={afterPreview} alt="After preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 text-xs">
                    No image selected
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5" loading={loading} disabled={loading}>
              {loading ? 'AI Verifying Infrastructure...' : 'Submit & Analyze Completion'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default BeforeAfterUpload;
