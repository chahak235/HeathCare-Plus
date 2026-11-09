import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  User,
  MapPin,
  AlertCircle,
  ExternalLink,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import realtimeService from "../../../services/realtime.service";
import BookingCalendar, { DayAvailability } from "./BookingCalendar";

export type BookingMode = "online" | "offline";

interface DoctorOption {
  id: string | number;
  name: string;
  specialization?: string;
  hospitalId?: number | null;
  hospitalName?: string | null;
  available?: string[];
}

interface TimeSlotOption {
  startTime: string; // ISO
  endTime: string; // ISO
  available: boolean;
}

interface AvailabilityInfo {
  acceptingPatients: boolean;
  workingDays: string[];
  workingHours: string;
  slotMinutes: number;
  days: DayAvailability[];
}

interface AppointmentBookingModalProps {
  isOpen: boolean;
  selectedDoctor?: DoctorOption | null;
  /** "online" opens straight on video consultation booking */
  initialMode?: BookingMode;
  onClose: () => void;
}

const formatDate = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, opts);

const formatSlotTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  selectedDoctor: initialDoctor,
  initialMode = "offline",
  onClose,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<BookingMode>(initialMode);
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{
    confirmed: boolean;
    meetLink?: string | null;
    notes: string[];
    message: string;
  } | null>(null);

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  const [availability, setAvailability] = useState<AvailabilityInfo | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [slots, setSlots] = useState<TimeSlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const activeDoctor = selectedDoctor ?? initialDoctor;
  const isOnline = mode === "online";

  // Reset whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    if (initialDoctor) {
      setSelectedDoctor(initialDoctor);
      setStep(2);
    } else {
      setSelectedDoctor(null);
      setStep(1);
    }
    setSelectedDate("");
    setSelectedTime("");
    setSymptoms("");
    setError(null);
    setBookingSuccess(null);
  }, [initialDoctor, initialMode, isOpen]);

  // Doctor list
  useEffect(() => {
    if (!isOpen || initialDoctor) return;
    let cancelled = false;
    setDoctorsLoading(true);
    setDoctorsError(null);
    realtimeService
      .getDoctors()
      .then((res) => {
        if (cancelled) return;
        const raw: any[] = res?.data?.doctors ?? res?.data ?? [];
        setDoctors(
          raw.map((d) => ({
            id: d.id,
            name: d.name,
            specialization: d.specialty || d.specialization,
            hospitalId: d.hospitalId ?? null,
            hospitalName: d.hospital_name ?? d.hospitalName ?? null,
          }))
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load doctors:", err);
        setDoctorsError("Couldn't load the doctor list. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setDoctorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialDoctor]);

  // Which dates have openings (next 90 days)
  useEffect(() => {
    if (!isOpen || !activeDoctor) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    setAvailabilityLoading(true);
    realtimeService
      .getAvailability(parseInt(String(activeDoctor.id)))
      .then((res) => {
        if (!cancelled) setAvailability(res?.data ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load availability:", err);
        setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeDoctor]);

  // Slots for the chosen date
  useEffect(() => {
    if (!activeDoctor || !selectedDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSelectedTime("");
    realtimeService
      .getAvailableSlots(parseInt(String(activeDoctor.id)), selectedDate)
      .then((res) => {
        if (!cancelled) setSlots(res?.data ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load slots:", err);
        setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeDoctor, selectedDate]);

  const handleSubmit = async () => {
    if (!activeDoctor || !selectedDate || !selectedTime) return;
    if (!isAuthenticated || !user) {
      setError("Please log in to book an appointment.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: patientData } = await realtimeService.getPatientForUser(user.id);
      const patientId = patientData?.patientId;
      if (!patientId) {
        setError("No patient profile found. Please complete your profile first.");
        return;
      }

      const res = await realtimeService.bookAppointment({
        patientId,
        doctorId: parseInt(String(activeDoctor.id)),
        hospitalId: (activeDoctor as any).hospitalId ?? undefined,
        appointmentType: isOnline ? "online" : "in-person",
        scheduledTime: selectedTime,
        symptoms: symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });

      const appt = res?.data ?? {};
      const confirmed = appt.status === "confirmed";
      const when = `${formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })} at ${formatSlotTime(selectedTime)}`;
      const notes: string[] = [];
      if (confirmed) {
        notes.push("A confirmation email has been sent to you and the doctor.");
        if (appt.calendarEventCreated) notes.push("The appointment was added to the doctor's Google Calendar.");
      } else {
        notes.push(`You'll get an email as soon as ${activeDoctor.name} confirms.`);
      }
      if (isOnline && !appt.meetingLink) {
        notes.push("The Google Meet link will be emailed to you once it's ready.");
      }

      setBookingSuccess({
        confirmed,
        meetLink: appt.meetingLink ?? null,
        notes,
        message: confirmed
          ? `Your ${isOnline ? "online consultation" : "clinic visit"} with ${activeDoctor.name} is confirmed for ${when}.`
          : `Your request to see ${activeDoctor.name} on ${when} has been sent.`,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const openSlots = slots.filter((s) => s.available);
  const tabClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-white shadow-sm"
        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl w-full max-w-[640px] max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center text-neutral-900 dark:text-white">
            <Calendar className="mr-2" /> Book Appointment
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            <X />
          </button>
        </div>

        {!bookingSuccess && (
          <div className="flex gap-1 p-1 mb-5 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
            <button type="button" className={tabClass(!isOnline)} onClick={() => setMode("offline")}>
              <MapPin className="w-4 h-4" /> In-clinic visit
            </button>
            <button type="button" className={tabClass(isOnline)} onClick={() => setMode("online")}>
              <Video className="w-4 h-4" /> Online video consult
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {bookingSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="flex items-start gap-2 text-green-800 dark:text-green-200 font-medium">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                {bookingSuccess.message}
              </p>
              {bookingSuccess.meetLink && (
                <a
                  href={bookingSuccess.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Join Google Meet
                </a>
              )}
              <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {bookingSuccess.notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </div>
            <button onClick={onClose} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Done
            </button>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Choose a doctor</h3>
                {doctorsLoading && (
                  <div className="flex items-center gap-2 text-neutral-500 py-6 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading doctors...
                  </div>
                )}
                {doctorsError && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="flex-shrink-0 w-4 h-4" />
                    <span className="text-sm">{doctorsError}</span>
                  </div>
                )}
                {!doctorsLoading && !doctorsError && doctors.length === 0 && (
                  <p className="text-sm text-neutral-500 py-6 text-center">No doctors are available to book right now.</p>
                )}
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className="w-full text-left border dark:border-neutral-600 p-3 rounded-lg mb-2 hover:border-primary-500"
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setSelectedDate("");
                      setStep(2);
                    }}
                  >
                    <div className="flex items-center">
                      <User className="mr-3 text-neutral-600 dark:text-neutral-400" />
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">{doc.name}</div>
                        <div className="text-sm text-neutral-500">
                          {doc.specialization}
                          {doc.hospitalName ? ` · ${doc.hospitalName}` : ""}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && activeDoctor && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Pick a date and time</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {activeDoctor.name}
                      {availability && ` · ${availability.workingDays.map((d) => d.slice(0, 3)).join(", ")} · ${availability.workingHours}`}
                    </p>
                  </div>
                  {!initialDoctor && (
                    <button type="button" onClick={() => setStep(1)} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Change doctor
                    </button>
                  )}
                </div>

                {availabilityLoading && (
                  <div className="flex items-center gap-2 text-neutral-500 py-8 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading calendar...
                  </div>
                )}
                {!availabilityLoading && availability && !availability.acceptingPatients && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 py-4 text-center">
                    {activeDoctor.name} isn't accepting new appointments right now.
                  </p>
                )}
                {!availabilityLoading && !availability && (
                  <p className="text-sm text-red-600 py-4 text-center">Couldn't load this doctor's calendar. Please try again.</p>
                )}
                {!availabilityLoading && availability?.acceptingPatients && (
                  <BookingCalendar days={availability.days} selectedDate={selectedDate} onSelect={setSelectedDate} />
                )}

                {selectedDate && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })}
                    </h4>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 text-neutral-500 py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking times...
                      </div>
                    ) : openSlots.length === 0 ? (
                      <p className="text-sm text-neutral-500 py-4 text-center">No open times on this day. Try another date.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {openSlots.map((slot) => (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setSelectedTime(slot.startTime)}
                            className={`p-2 border rounded-lg flex items-center justify-center gap-1 text-sm ${
                              selectedTime === slot.startTime
                                ? "bg-primary-600 border-primary-600 text-white"
                                : "dark:border-neutral-600 dark:text-neutral-300 hover:border-primary-500"
                            }`}
                          >
                            <Clock className="w-3.5" />
                            {formatSlotTime(slot.startTime)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="mt-5 bg-primary-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 hover:bg-primary-700"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 3 && activeDoctor && (
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Confirm your booking</h3>
                <div className="border dark:border-neutral-600 p-4 rounded-lg mb-4 space-y-1 text-neutral-800 dark:text-neutral-200">
                  <p><strong>Doctor:</strong> {activeDoctor.name}</p>
                  <p><strong>Date:</strong> {formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                  <p><strong>Time:</strong> {formatSlotTime(selectedTime)}</p>
                  <p><strong>Type:</strong> {isOnline ? "Online video consultation (Google Meet)" : "In-clinic visit"}</p>
                  {!isOnline && activeDoctor.hospitalName && <p><strong>Where:</strong> {activeDoctor.hospitalName}</p>}
                </div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="booking-symptoms">
                  Symptoms or reason for visit (optional, separate with commas)
                </label>
                <input
                  id="booking-symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. fever, cough"
                  className="w-full mb-4 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border dark:border-neutral-600 dark:text-neutral-300">
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Booking..." : "Confirm & Book"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentBookingModal;
