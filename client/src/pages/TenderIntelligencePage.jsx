import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout.jsx';
import TenderUploadForm from '../components/tender/TenderUploadForm.jsx';
import TenderSummaryCard from '../components/tender/TenderSummaryCard.jsx';
import ContractorScoreCard from '../components/tender/ContractorScoreCard.jsx';
import { getTenders } from '../services/tenderService.js';
import { FileSpreadsheet, Eye, ChevronRight, HelpCircle } from 'lucide-react';

export const TenderIntelligencePage = () => {
  const [tenders, setTenders] = useState([]);
  const [selectedTender, setSelectedTender] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const list = await getTenders();
      setTenders(list);
      if (list.length > 0 && !selectedTender) {
        setSelectedTender(list[0]);
      }
    } catch (err) {
      console.error('Failed to load tenders list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleUploadSuccess = (newTender) => {
    setTenders(prev => [newTender, ...prev]);
    setSelectedTender(newTender);
  };

  return (
    <PageLayout title="AI Tender Intelligence">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload Form & Past Audits */}
        <div className="lg:col-span-4 space-y-6">
          <TenderUploadForm onUploadSuccess={handleUploadSuccess} />

          {/* Past Audits List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <FileSpreadsheet className="h-4.5 w-4.5 text-slate-400" /> Audit Ledger History
            </h3>
            
            {loading && tenders.length === 0 ? (
              <p className="text-xs text-slate-450 italic py-4">Loading audit logs...</p>
            ) : tenders.length === 0 ? (
              <p className="text-xs text-slate-450 italic py-4">No audits conducted yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {tenders.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedTender(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedTender?._id === item._id
                        ? 'border-brand-500 bg-brand-50/15 font-medium'
                        : 'border-slate-50 hover:border-slate-100 bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-dark-800 font-semibold truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.contractor?.name || 'N/A'}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis Cards */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTender ? (
            <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
              {/* Tender intelligence results */}
              <TenderSummaryCard tender={selectedTender} />
              
              {/* Contractor score metrics */}
              {selectedTender.contractor && (
                <ContractorScoreCard contractor={selectedTender.contractor} />
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
              <FileSpreadsheet className="h-12 w-12 text-slate-200 mb-2.5 animate-pulse" />
              <h4 className="font-semibold text-sm text-dark-800">Awaiting Tender Selection</h4>
              <p className="text-xs max-w-xs mt-1 leading-normal">
                Upload a tender document in the side panel or select an existing record in the ledger to review AI audit logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TenderIntelligencePage;
