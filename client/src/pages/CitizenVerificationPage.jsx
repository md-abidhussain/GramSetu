import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout.jsx';
import CitizenReportForm from '../components/citizen/CitizenReportForm.jsx';
import DiscrepancyReport from '../components/citizen/DiscrepancyReport.jsx';
import { ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

export const CitizenVerificationPage = () => {
  const [verificationResult, setVerificationResult] = useState(null);

  const handleReportSubmitted = (result) => {
    setVerificationResult(result);
  };

  return (
    <PageLayout title="Citizen Portal">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Public Header */}
        <div className="text-center space-y-2 py-4">
          <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider bg-brand-50 border border-brand-100 px-3 py-1 rounded">
            Transparent Governance
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-dark-800">Verify Infrastructure Integrity</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Every citizen has the power to audit public construction works. Upload a photo, pinpoint coordinates, and submit details directly for automated compliance verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* Submission Form */}
          <CitizenReportForm onSubmitSuccess={handleReportSubmitted} />

          {/* AI Discrepancy Analysis Result */}
          {verificationResult && (
            <DiscrepancyReport result={verificationResult} />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CitizenVerificationPage;
