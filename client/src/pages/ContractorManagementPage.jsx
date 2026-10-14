import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/layout/PageLayout.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { createContractor, getContractors } from '../services/contractorService.js';
import { Search, PlusCircle, Building2, Mail, Phone, MapPin, ShieldCheck, Briefcase, FileText, BadgeCheck } from 'lucide-react';

const initialForm = {
  name: '',
  registrationId: '',
  contactPerson: '',
  contactEmail: '',
  phone: '',
  address: '',
  expertise: '',
  remarks: '',
  performanceScore: 100,
  completedOnTime: 0,
  delayedCount: 0,
  averageBudgetVariance: 0
};

export const ContractorManagementPage = () => {
  const [contractors, setContractors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(initialForm);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const data = await getContractors();
      setContractors(data);
    } catch (error) {
      setMessage(error.message || 'Unable to load contractors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const filteredContractors = useMemo(() => {
    const term = search.toLowerCase();
    return contractors.filter((contractor) => {
      const haystack = `${contractor.name} ${contractor.registrationId} ${contractor.contactPerson} ${contractor.expertise}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [contractors, search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const created = await createContractor(form);
      setContractors((prev) => [created, ...prev]);
      setForm(initialForm);
      setMessage('Contractor profile created successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to create contractor profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Contractor Management">
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-brand-600" /> Registered Contractors
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">Authority-managed contractor registry and contact details</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm"
                placeholder="Search contractor"
              />
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Loading contractors...</p>
            ) : filteredContractors.length === 0 ? (
              <p className="text-sm text-slate-500">No contractor records available.</p>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {filteredContractors.map((contractor) => (
                  <div key={contractor._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-dark-800">{contractor.name}</p>
                        <p className="text-xs text-slate-500">{contractor.registrationId}</p>
                      </div>
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {contractor.performanceScore}% trust
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {contractor.contactEmail || 'No email'}</div>
                      <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {contractor.phone || 'No phone'}</div>
                      <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {contractor.address || 'No address'}</div>
                      <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> {contractor.expertise || 'No specialization'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-4.5 w-4.5 text-brand-600" /> Create Contractor Profile
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">Authority-only form for onboarding contractor records</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>}

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                  <BadgeCheck className="h-4 w-4 text-brand-600" /> Basic contractor details
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Contractor name</span>
                    <input required placeholder="Enter company or contractor name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Registration ID</span>
                    <input required placeholder="Official registration number" value={form.registrationId} onChange={(event) => setForm({ ...form, registrationId: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                  <Briefcase className="h-4 w-4 text-brand-600" /> Contact & location
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Contact person</span>
                    <input placeholder="Primary person in charge" value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Email address</span>
                    <input type="email" placeholder="official@email.com" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Phone number</span>
                    <input placeholder="Phone or mobile" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Office address</span>
                    <input placeholder="Registered office / site address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                  <FileText className="h-4 w-4 text-brand-600" /> Work profile & performance
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Specialization / expertise</span>
                    <input placeholder="e.g. Road construction, bridge works, drainage" value={form.expertise} onChange={(event) => setForm({ ...form, expertise: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Performance score</span>
                    <input type="number" placeholder="100" value={form.performanceScore} onChange={(event) => setForm({ ...form, performanceScore: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Completed on time</span>
                    <input type="number" placeholder="0" value={form.completedOnTime} onChange={(event) => setForm({ ...form, completedOnTime: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Delayed count</span>
                    <input type="number" placeholder="0" value={form.delayedCount} onChange={(event) => setForm({ ...form, delayedCount: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Budget variance (%)</span>
                    <input type="number" placeholder="0" value={form.averageBudgetVariance} onChange={(event) => setForm({ ...form, averageBudgetVariance: Number(event.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </label>
                </div>
              </div>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Authority remarks</span>
                <textarea placeholder="Add notes about contractor reliability, eligibility, or monitoring status" rows={4} value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <Button type="submit" loading={saving} className="w-full">Save contractor profile</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ContractorManagementPage;
