import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { getContractorLeaderboard } from '../../services/dashboardService.js';
import { createTender } from '../../services/tenderService.js';
import { FileUp, CheckCircle2, AlertCircle } from 'lucide-react';

export const TenderUploadForm = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [timelineStart, setTimelineStart] = useState('');
  const [timelineEnd, setTimelineEnd] = useState('');
  const [file, setFile] = useState(null);
  
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch contractors for the dropdown list
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const list = await getContractorLeaderboard();
        setContractors(list.map(c => ({ value: c._id, label: `${c.name} (${c.registrationId})` })));
      } catch (err) {
        console.error('Failed to fetch contractors', err);
      }
    };
    fetchContractors();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF documents are allowed');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !contractorId || !file) {
      setError('Title, contractor, and PDF file are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('contractorId', contractorId);
      formData.append('timelineStart', timelineStart);
      formData.append('timelineEnd', timelineEnd);
      formData.append('file', file);

      const result = await createTender(formData);
      setSuccess(true);
      setTitle('');
      setContractorId('');
      setTimelineStart('');
      setTimelineEnd('');
      setFile(null);
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and analyze tender');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Tender Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-sm flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>Tender analyzed successfully and saved to ledger!</span>
            </div>
          )}

          <Input
            label="Tender Title"
            id="tender-title"
            placeholder="e.g. Village Water Pipeline Installation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />

          <Select
            label="Assigned Contractor"
            id="tender-contractor"
            placeholder="Select a contractor..."
            options={contractors}
            value={contractorId}
            onChange={(e) => setContractorId(e.target.value)}
            required
            disabled={loading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Estimated Timeline Start"
              id="timeline-start"
              value={timelineStart}
              onChange={(e) => setTimelineStart(e.target.value)}
              disabled={loading}
            />
            <Input
              type="date"
              label="Estimated Timeline End"
              id="timeline-end"
              value={timelineEnd}
              onChange={(e) => setTimelineEnd(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tender Document (PDF only) <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-md p-6 text-center hover:border-brand-500 transition-colors cursor-pointer bg-white hover:bg-slate-50/50 relative">
              <input
                type="file"
                id="tender-file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <FileUp className="h-8 w-8 text-slate-400" />
                <span className="text-sm font-medium text-dark-800">
                  {file ? file.name : 'Click or drag PDF tender here'}
                </span>
                <span className="text-xs text-slate-400">PDF documents up to 10MB</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Extracting & Auditing...' : 'Upload & Analyze Tender'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TenderUploadForm;
