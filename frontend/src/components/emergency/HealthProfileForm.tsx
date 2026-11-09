import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2, CheckCircle2, AlertCircle, HeartPulse, Users, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { emergencyService, HealthProfile, EmergencyContact, cacheProfile } from '../../services/emergency-service';

const EMPTY: HealthProfile = {
  allergies: [],
  chronicConditions: [],
  currentMedications: [],
  emergencyContacts: [],
  preferredHospital: null,
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const input = 'w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';
const label = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';
const section = 'p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800';

interface Props {
  onSaved?: (p: HealthProfile) => void;
}

/** Health and emergency details used by the emergency button. */
const HealthProfileForm: React.FC<Props> = ({ onSaved }) => {
  const { token } = useAuth();
  const [p, setP] = useState<HealthProfile>(EMPTY);
  const [lists, setLists] = useState({ allergies: '', chronicConditions: '', currentMedications: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    emergencyService
      .getProfile(token)
      .then((data) => {
        setP({ ...EMPTY, ...data, emergencyContacts: data.emergencyContacts?.length ? data.emergencyContacts : [] });
        setLists({
          allergies: (data.allergies || []).join(', '),
          chronicConditions: (data.chronicConditions || []).join(', '),
          currentMedications: (data.currentMedications || []).join(', '),
        });
        cacheProfile(data);
      })
      .catch(() => setMessage({ ok: false, text: "Couldn't load your profile. You can still fill it in and save." }))
      .finally(() => setLoading(false));
  }, [token]);

  const setContact = (i: number, patch: Partial<EmergencyContact>) =>
    setP((prev) => ({ ...prev, emergencyContacts: prev.emergencyContacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const contacts = p.emergencyContacts.filter((c) => c.name.trim() || c.phone.trim());
    if (contacts.some((c) => !c.name.trim() || !c.phone.trim())) {
      setMessage({ ok: false, text: 'Each emergency contact needs a name and a phone number.' });
      return;
    }
    if (contacts.length === 0) {
      setMessage({ ok: false, text: 'Add at least one family emergency contact.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
      const saved = await emergencyService.saveProfile(token, {
        ...p,
        emergencyContacts: contacts,
        allergies: split(lists.allergies),
        chronicConditions: split(lists.chronicConditions),
        currentMedications: split(lists.currentMedications),
      });
      setP({ ...EMPTY, ...saved });
      cacheProfile(saved);
      setMessage({ ok: true, text: 'Saved. Your emergency button is ready.' });
      onSaved?.(saved);
    } catch (err: any) {
      setMessage({ ok: false, text: err?.response?.data?.error || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!token) return <p className="text-neutral-600 dark:text-neutral-400">Log in to set up your health and emergency profile.</p>;
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-500 py-8 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading your profile…
      </div>
    );
  }

  const hospital = p.preferredHospital || { name: '' };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className={section}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-red-500" /> Health details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={label} htmlFor="hp-dob">Date of birth</label>
            <input id="hp-dob" type="date" className={input} value={p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : ''} onChange={(e) => setP({ ...p, dateOfBirth: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="hp-gender">Gender</label>
            <select id="hp-gender" className={input} value={p.gender || ''} onChange={(e) => setP({ ...p, gender: e.target.value })}>
              <option value="">Select</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="hp-blood">Blood group</label>
            <select id="hp-blood" className={input} value={p.bloodGroup || ''} onChange={(e) => setP({ ...p, bloodGroup: e.target.value })}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label} htmlFor="hp-height">Height (cm)</label>
              <input id="hp-height" type="number" min={30} max={260} className={input} value={p.heightCm ?? ''} onChange={(e) => setP({ ...p, heightCm: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <label className={label} htmlFor="hp-weight">Weight (kg)</label>
              <input id="hp-weight" type="number" min={1} max={400} step="0.1" className={input} value={p.weightKg ?? ''} onChange={(e) => setP({ ...p, weightKg: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className={label} htmlFor="hp-conditions">Medical conditions</label>
            <input id="hp-conditions" className={input} placeholder="e.g. diabetes, asthma" value={lists.chronicConditions} onChange={(e) => setLists({ ...lists, chronicConditions: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="hp-allergies">Allergies</label>
            <input id="hp-allergies" className={input} placeholder="e.g. penicillin, peanuts" value={lists.allergies} onChange={(e) => setLists({ ...lists, allergies: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="hp-meds">Current medicines</label>
            <input id="hp-meds" className={input} placeholder="e.g. metformin 500 mg" value={lists.currentMedications} onChange={(e) => setLists({ ...lists, currentMedications: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <label className={label} htmlFor="hp-notes">Notes for responders (optional)</label>
          <textarea id="hp-notes" rows={2} className={input} placeholder="e.g. pacemaker fitted, epilepsy, pregnant" value={p.medicalNotes || ''} onChange={(e) => setP({ ...p, medicalNotes: e.target.value })} />
        </div>
      </div>

      <div className={section}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-primary-600" /> Family emergency contacts</h3>
          {p.emergencyContacts.length < 5 && (
            <button type="button" onClick={() => setP({ ...p, emergencyContacts: [...p.emergencyContacts, { name: '', relation: '', phone: '', email: '' }] })} className="text-sm inline-flex items-center gap-1 text-primary-600 hover:underline">
              <Plus className="w-4 h-4" /> Add contact
            </button>
          )}
        </div>
        {p.emergencyContacts.length === 0 && (
          <p className="text-sm text-neutral-500 mb-2">Add at least one person to alert in an emergency. Add an email to send them an automatic alert with your location.</p>
        )}
        <div className="space-y-3">
          {p.emergencyContacts.map((c, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-3"><label className={label}>Name</label><input className={input} value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={label}>Relation</label><input className={input} placeholder="Mother" value={c.relation || ''} onChange={(e) => setContact(i, { relation: e.target.value })} /></div>
              <div className="sm:col-span-3"><label className={label}>Phone</label><input className={input} type="tel" placeholder="+91 98xxxxxxx" value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} /></div>
              <div className="sm:col-span-3"><label className={label}>Email</label><input className={input} type="email" value={c.email || ''} onChange={(e) => setContact(i, { email: e.target.value })} /></div>
              <button type="button" aria-label={`Remove ${c.name || 'contact'}`} onClick={() => setP({ ...p, emergencyContacts: p.emergencyContacts.filter((_, j) => j !== i) })} className="sm:col-span-1 h-10 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={section}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-600" /> Hospital you usually visit</h3>
        <p className="text-sm text-neutral-500 mb-4">In an emergency we show this hospital alongside the nearest one.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={label}>Hospital name</label><input className={input} value={hospital.name} onChange={(e) => setP({ ...p, preferredHospital: { ...hospital, name: e.target.value } })} /></div>
          <div><label className={label}>Phone</label><input className={input} type="tel" value={hospital.phone || ''} onChange={(e) => setP({ ...p, preferredHospital: { ...hospital, phone: e.target.value } })} /></div>
          <div><label className={label}>Address</label><input className={input} value={hospital.address || ''} onChange={(e) => setP({ ...p, preferredHospital: { ...hospital, address: e.target.value } })} /></div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {message.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save health profile
      </button>
    </form>
  );
};

export default HealthProfileForm;
