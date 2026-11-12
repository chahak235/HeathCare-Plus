import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare, MapPin, Navigation, Loader2, Siren, HeartPulse, CheckCircle2, AlertCircle, Building2, Users, Settings, Volume2, VolumeX } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { useAuth } from '../contexts/AuthContext';
import { emergencyService, HealthProfile, cacheProfile, cachedProfile, telHref } from '../services/emergency-service';
import { FoundHospital, directionsUrl, hospitalsNear } from '../services/hospital-finder';
import { startSiren, stopSiren } from '../services/siren';

type Stage = 'ready' | 'locating' | 'active';

const Emergency: React.FC = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<HealthProfile | null>(() => cachedProfile());
  const [stage, setStage] = useState<Stage>('ready');
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<FoundHospital[] | null>(null);
  const [alertStatus, setAlertStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [sirenOn, setSirenOn] = useState(false);

  useEffect(() => {
    if (!token) return;
    emergencyService.getProfile(token).then((p) => { setProfile(p); cacheProfile(p); }).catch(() => undefined);
  }, [token]);

  useEffect(() => () => { abortRef.current?.abort(); stopSiren(); }, []);

  // Loud alarm so people nearby notice; runs up to 2 minutes or until stopped
  const toggleSiren = () => {
    if (sirenOn) { stopSiren(); setSirenOn(false); return; }
    setSirenOn(startSiren());
    window.setTimeout(() => setSirenOn(false), 120_000);
  };

  const mapsLink = pos ? `https://www.google.com/maps?q=${pos.lat},${pos.lng}` : null;
  const name = profile?.name || user?.name || 'I';
  const smsBody = `EMERGENCY: ${name === 'I' ? 'I need' : `${name} needs`} help.${mapsLink ? ` Location: ${mapsLink}` : ''}${profile?.bloodGroup ? ` Blood group ${profile.bloodGroup}.` : ''}`;
  const cleanPhone = (phone: string) => phone.replace(/[^\d+]/g, '');
  const smsHref = (phone: string) => `sms:${cleanPhone(phone)}?body=${encodeURIComponent(smsBody)}`;

  // One text to every family contact at once (patient just presses Send).
  // iPhone and Android use different formats for several recipients.
  const familyPhones = (profile?.emergencyContacts || []).map((c) => cleanPhone(c.phone || '')).filter((x) => x.length >= 6);
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isPhone = isIos || /Android/i.test(navigator.userAgent);
  const textAllHref = familyPhones.length
    ? isIos
      ? `sms://open?addresses=${familyPhones.join(',')}&body=${encodeURIComponent(smsBody)}`
      : `sms:${familyPhones.join(',')}?body=${encodeURIComponent(smsBody)}`
    : null;
  // WhatsApp's share screen lets the patient pick several people or a family group
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(smsBody)}`;

  // Best hospital to call: nearest with an emergency department and a phone, then nearest with a phone
  const withPhone = (hospitals || []).filter((h) => h.phone);
  const nearestCallable = withPhone.find((h) => h.emergency) || withPhone[0] || null;
  const nearest = hospitals?.[0] || null;

  const activate = () => {
    // Started inside the tap, so the browser allows the sound
    setSirenOn(startSiren());
    window.setTimeout(() => setSirenOn(false), 120_000);
    setStage('locating');
    setLocationError(null);
    setAlertStatus(null);
    if (!navigator.geolocation) {
      setLocationError('Location is not available on this device.');
      setStage('active');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(here);
        setStage('active');

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const found = await hospitalsNear(here.lat, here.lng, 8, controller.signal).catch(() => []);
        setHospitals(found);

        if (token) {
          const target = found.find((h) => h.emergency && h.phone) || found[0];
          emergencyService
            .sendAlert(token, { lat: here.lat, lng: here.lng, hospital: target ? { name: target.name, phone: target.phone, distanceKm: target.distanceKm } : null })
            .then((r) => {
              const sent = r.contacts.filter((c) => c.emailed).map((c) => c.name);
              setAlertStatus(sent.length ? { ok: true, text: `Nearby hospitals alerted. Emailed your location to ${sent.join(', ')}.` } : { ok: false, text: 'Nearby hospitals alerted, but the family emails could not be sent. Text your family below.' });
            })
            .catch((err) => {
              const msg: string = err?.response?.data?.error || '';
              // No family email saved: the alert still reached nearby hospitals
              if (err?.response?.status === 400 && /email address/i.test(msg)) {
                setAlertStatus({ ok: true, text: 'Nearby hospitals alerted. Text your family with the button below.' });
              } else {
                setAlertStatus({ ok: false, text: msg || 'The alert could not be sent. Call 112 and text your family below.' });
              }
            });
        }
      },
      () => {
        setLocationError('Location was blocked, so we cannot find the nearest hospital. Call 112 now.');
        setStage('active');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const callButton = 'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors';
  const card = 'p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800';

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white dark:from-red-950/30 dark:via-neutral-950 dark:to-neutral-950 py-10">
      <Container>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Emergency Help</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              One tap finds the nearest hospital, alerts your family with your location, and gives you call buttons for both.
            </p>
          </div>

          <a href="tel:112" className={`${callButton} w-full mb-6 bg-red-600 hover:bg-red-700 text-white text-xl py-4 shadow-lg`}>
            <Phone className="w-6 h-6" /> Call 112 (National Emergency)
          </a>

          {stage === 'ready' && (
            <div className="text-center mb-8">
              <button
                type="button"
                onClick={activate}
                className="mx-auto w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl shadow-red-500/40 flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
              >
                <Siren className="w-14 h-14" />
                <span className="text-2xl font-bold">SOS</span>
                <span className="text-xs opacity-90">Alarm · find hospital · alert family</span>
              </button>
            </div>
          )}

          {stage === 'locating' && (
            <div className="flex items-center justify-center gap-2 text-neutral-700 dark:text-neutral-300 py-10">
              <Loader2 className="w-6 h-6 animate-spin" /> Getting your location…
            </div>
          )}

          {stage !== 'ready' && (
            <button
              type="button"
              onClick={toggleSiren}
              aria-pressed={sirenOn}
              className={`${callButton} w-full mb-5 ${sirenOn ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' : 'border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
            >
              {sirenOn ? <><VolumeX className="w-5 h-5" /> Stop alarm sound</> : <><Volume2 className="w-5 h-5" /> Sound alarm</>}
            </button>
          )}

          {stage === 'active' && (
            <div className="space-y-5">
              {locationError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4" /> {locationError}</div>
              )}
              {alertStatus && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${alertStatus.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'}`}>
                  {alertStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {alertStatus.text}
                </div>
              )}

              <div className={card}>
                <h2 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><Building2 className="w-5 h-5 text-red-600" /> Nearest hospital</h2>
                {pos && hospitals === null && <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Searching hospitals near you…</p>}
                {hospitals && hospitals.length === 0 && <p className="text-sm text-neutral-500">No hospitals found within 8 km. Call 112.</p>}
                {nearestCallable && (
                  <div className="mb-3">
                    <p className="font-medium text-neutral-900 dark:text-white">{nearestCallable.name}{nearestCallable.emergency ? ' · Emergency department' : ''}</p>
                    <p className="text-sm text-neutral-500">{nearestCallable.distanceKm} km away{nearestCallable.address ? ` · ${nearestCallable.address}` : ''}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a href={telHref(nearestCallable.phone!)} className={`${callButton} bg-red-600 hover:bg-red-700 text-white`}><Phone className="w-5 h-5" /> Call hospital</a>
                      <a href={directionsUrl(nearestCallable)} target="_blank" rel="noopener noreferrer" className={`${callButton} border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200`}><Navigation className="w-5 h-5" /> Directions</a>
                    </div>
                  </div>
                )}
                {nearest && nearest !== nearestCallable && (
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">Closest overall: <strong>{nearest.name}</strong> ({nearest.distanceKm} km)</p>
                    <a href={directionsUrl(nearest)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"><Navigation className="w-4 h-4" /> Directions</a>
                  </div>
                )}
              </div>

              {profile?.preferredHospital?.name && (
                <div className={card}>
                  <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">Your usual hospital</h2>
                  <p className="text-neutral-800 dark:text-neutral-200">{profile.preferredHospital.name}</p>
                  {profile.preferredHospital.address && <p className="text-sm text-neutral-500">{profile.preferredHospital.address}</p>}
                  {profile.preferredHospital.phone && (
                    <a href={telHref(profile.preferredHospital.phone)} className={`${callButton} mt-3 bg-primary-600 hover:bg-primary-700 text-white`}><Phone className="w-5 h-5" /> Call {profile.preferredHospital.name}</a>
                  )}
                </div>
              )}

              <div className={card}>
                <h2 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-primary-600" /> Family</h2>
                {!isAuthenticated && <p className="text-sm text-neutral-600 dark:text-neutral-400"><Link to="/login" className="text-primary-600 hover:underline">Log in</Link> to call and alert your saved family contacts.</p>}
                {isAuthenticated && !profile?.emergencyContacts?.length && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">No family contacts saved. <Link to="/profile" className="text-primary-600 hover:underline">Add them in your profile</Link>.</p>
                )}
                {familyPhones.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {textAllHref && (
                        <a href={textAllHref} className={`${callButton} bg-red-600 hover:bg-red-700 text-white py-3`}>
                          <MessageSquare className="w-5 h-5" /> Text all family ({familyPhones.length})
                        </a>
                      )}
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${callButton} bg-green-600 hover:bg-green-700 text-white py-3`}>
                        <MessageSquare className="w-5 h-5" /> Send on WhatsApp
                      </a>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      {isPhone
                        ? 'Opens your messages with the text ready. Just press Send.'
                        : 'Texting works from your phone. On a computer, use WhatsApp or call.'}
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {profile?.emergencyContacts?.map((c) => (
                    <div key={`${c.name}-${c.phone}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 dark:text-white">{c.name}{c.relation ? ` (${c.relation})` : ''}</p>
                        <p className="text-sm text-neutral-500">{c.phone}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:w-64">
                        <a href={telHref(c.phone)} className={`${callButton} bg-primary-600 hover:bg-primary-700 text-white py-2.5`}><Phone className="w-4 h-4" /> Call</a>
                        <a href={smsHref(c.phone)} className={`${callButton} border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 py-2.5`}><MessageSquare className="w-4 h-4" /> Text</a>
                      </div>
                    </div>
                  ))}
                </div>
                {mapsLink && (
                  <p className="mt-3 text-xs text-neutral-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Texts include your location: {mapsLink}</p>
                )}
              </div>

              <button type="button" onClick={activate} className="text-sm text-primary-600 hover:underline">Refresh location and search again</button>
            </div>
          )}

          {profile && (profile.bloodGroup || profile.allergies?.length || profile.chronicConditions?.length || profile.currentMedications?.length) && (
            <div className={`${card} mt-6 border-red-200 dark:border-red-900`}>
              <h2 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-red-500" /> Medical info for responders</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {profile.name && <><dt className="text-neutral-500">Name</dt><dd className="text-neutral-900 dark:text-white font-medium">{profile.name}</dd></>}
                {profile.bloodGroup && <><dt className="text-neutral-500">Blood group</dt><dd className="text-neutral-900 dark:text-white font-medium">{profile.bloodGroup}</dd></>}
                {!!profile.allergies?.length && <><dt className="text-neutral-500">Allergies</dt><dd className="text-neutral-900 dark:text-white">{profile.allergies.join(', ')}</dd></>}
                {!!profile.chronicConditions?.length && <><dt className="text-neutral-500">Conditions</dt><dd className="text-neutral-900 dark:text-white">{profile.chronicConditions.join(', ')}</dd></>}
                {!!profile.currentMedications?.length && <><dt className="text-neutral-500">Medicines</dt><dd className="text-neutral-900 dark:text-white">{profile.currentMedications.join(', ')}</dd></>}
                {profile.heightCm && profile.weightKg && <><dt className="text-neutral-500">Height / weight</dt><dd className="text-neutral-900 dark:text-white">{profile.heightCm} cm / {profile.weightKg} kg</dd></>}
                {profile.medicalNotes && <><dt className="text-neutral-500">Notes</dt><dd className="text-neutral-900 dark:text-white">{profile.medicalNotes}</dd></>}
              </dl>
            </div>
          )}

          {isAuthenticated && (
            <Link to="/profile" className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600">
              <Settings className="w-4 h-4" /> Edit health profile and emergency contacts
            </Link>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Emergency;
