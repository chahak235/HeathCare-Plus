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
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import realtimeService from "../../../services/realtime.service";

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

interface AppointmentBookingModalProps {
  isOpen: boolean;
  selectedDoctor?: DoctorOption | null;
  onClose: () => void;
}

const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  selectedDoctor: initialDoctor,
  onClose,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [consultationType, setConsultationType] = useState<
    "video" | "in-person"
  >("video");
  const [patientInfo, setPatientInfo] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{
    meetLink?: string | null;
    calendarNote?: string | null;
    message: string;
  } | null>(null);

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  const [slots, setSlots] = useState<TimeSlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Use initial doctor from props or internal selection
  const activeDoctor = selectedDoctor ?? initialDoctor;

  // Generate next X days dynamically
  const generateNextDays = (days: number) => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate.toISOString().split("T")[0]);
    }
    return dates;
  };

  const availableDates = generateNextDays(7);

  // Load the real doctor list from the backend when the picker step is shown.
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

  // If initialDoctor is passed, skip step 1
  useEffect(() => {
    if (initialDoctor && isOpen) {
      setSelectedDoctor(initialDoctor);
      setStep(2);
    } else if (!initialDoctor && isOpen) {
      setStep(1);
      setSelectedDoctor(null);
    }
    setError(null);
    setBookingSuccess(null);
  }, [initialDoctor, isOpen]);

  // Load this doctor's real open/booked slots for the selected date.
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
        if (cancelled) return;
        setSlots(res?.data ?? []);
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

  const formatSlotTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

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
        setLoading(false);
        return;
      }

      const payload = {
        patientId,
        doctorId: parseInt(String(activeDoctor.id)),
        hospitalId: (activeDoctor as any).hospitalId ?? undefined,
        appointmentType: consultationType === "video" ? "online" : "in-person",
        scheduledTime: selectedTime, // already an ISO string from the real slot
        symptoms: [],
      };

      await realtimeService.bookAppointment(payload);

      // Booking only sends a request — the doctor still has to accept it.
      // No meeting link exists yet even for video: that's generated once
      // the doctor confirms, so we don't hand out a link (or claim a
      // calendar event was created) for a visit that isn't accepted yet.
      const message = `Your request to see ${activeDoctor.name} on ${new Date(
        selectedDate
      ).toLocaleDateString()} at ${formatSlotTime(selectedTime)} has been sent.`;

      setBookingSuccess({
        meetLink: null,
        calendarNote:
          "You'll get a notification as soon as the doctor confirms" +
          (consultationType === "video" ? " — the Google Meet link will be included then." : "."),
        message,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Failed to book appointment.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(initialDoctor ? 2 : 1);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
    setPatientInfo({ name: "", email: "" });
    setError(null);
    setBookingSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center text-neutral-900 dark:text-white">
            <Calendar className="mr-2" /> Book Appointment
          </h2>
          <button onClick={handleClose} className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            <X />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {bookingSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">{bookingSuccess.message}</p>
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
              {bookingSuccess.calendarNote && (
                <p
                  className={`mt-2 text-sm ${
                    bookingSuccess.meetLink
                      ? "text-neutral-600 dark:text-neutral-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {bookingSuccess.calendarNote}
                </p>
              )}
            </div>
            <button onClick={handleClose} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Done
            </button>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Select Doctor</h3>

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
                  <p className="text-sm text-neutral-500 py-6 text-center">
                    No doctors are available to book right now.
                  </p>
                )}

                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="border dark:border-neutral-600 p-3 rounded-lg mb-2 cursor-pointer hover:border-blue-500 dark:hover:border-primary-500"
                    onClick={() => {
                      setSelectedDoctor(doc);
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
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Select Date & Time</h3>
                {activeDoctor && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Booking with {activeDoctor.name}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {availableDates.map((date: string) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 border rounded text-sm ${
                        selectedDate === date
                          ? "bg-blue-100 dark:bg-primary-900/30 border-blue-500 dark:border-primary-500"
                          : "dark:border-neutral-600 dark:text-neutral-300"
                      }`}
                    >
                      {new Date(date).toLocaleDateString()}
                    </button>
                  ))}
                </div>
                {selectedDate && slotsLoading && (
                  <div className="flex items-center gap-2 text-neutral-500 py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking {activeDoctor?.name}'s availability...
                  </div>
                )}

                {selectedDate && !slotsLoading && slots.filter((s) => s.available).length === 0 && (
                  <p className="text-sm text-neutral-500 py-4 text-center">
                    No open slots with {activeDoctor?.name} on this day — try another date.
                  </p>
                )}

                {selectedDate && !slotsLoading && slots.filter((s) => s.available).length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {slots
                      .filter((s) => s.available)
                      .map((slot) => (
                        <button
                          key={slot.startTime}
                          onClick={() => setSelectedTime(slot.startTime)}
                          className={`p-2 border rounded flex items-center gap-1 ${
                            selectedTime === slot.startTime
                              ? "bg-blue-100 dark:bg-primary-900/30 border-blue-500 dark:border-primary-500"
                              : "dark:border-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          <Clock className="w-4" />
                          {formatSlotTime(slot.startTime)}
                        </button>
                      ))}
                  </div>
                )}
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setConsultationType("video")}
                    className={`p-2 border rounded flex items-center gap-2 ${
                      consultationType === "video"
                        ? "bg-blue-100 dark:bg-primary-900/30 border-blue-500 dark:border-primary-500"
                        : "dark:border-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    <Video className="w-4" />
                    Video (Google Meet)
                  </button>
                  <button
                    onClick={() => setConsultationType("in-person")}
                    className={`p-2 border rounded flex items-center gap-2 ${
                      consultationType === "in-person"
                        ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-500"
                        : "dark:border-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    <MapPin className="w-4" />
                    In-Person
                  </button>
                </div>
                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">Confirm Appointment</h3>
                <div className="border dark:border-neutral-600 p-3 rounded mb-4">
                  <p><strong>Doctor:</strong> {activeDoctor?.name}</p>
                  <p><strong>Date:</strong> {selectedDate && new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
                  <p><strong>Time:</strong> {selectedTime && formatSlotTime(selectedTime)}</p>
                  <p><strong>Type:</strong> {consultationType === "video" ? "Video (Google Meet)" : "In-Person"}</p>
                </div>
                {consultationType === "video" && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Once {activeDoctor?.name} confirms, a Google Meet link will be generated and you'll be notified.
                  </p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Booking..." : "Confirm & Book"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentBookingModal;
