import { Router, Request, Response } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { socketService as importedSocketService } from '../websocket';
import { getServices } from '../services';

const router = Router();

// `socketService`/`notificationService` are only assigned once the HTTP server
// finishes booting (inside the app.listen callback in app.ts), but this routes
// module is imported — and used to eagerly build the controller — before that
// happens. Building the controller lazily on each request, once services are
// guaranteed to be ready, avoids permanently capturing `undefined`.
function getController(): AppointmentController {
  const { notificationService } = getServices();
  return new AppointmentController(importedSocketService, notificationService as any);
}

function bind(method: keyof AppointmentController) {
  return (req: Request, res: Response) => (getController()[method] as any)(req, res);
}

// Get available slots
router.get('/slots', bind('getAvailableSlots'));

// Get patient ID for user (booking flow)
router.get('/patient-for-user/:userId', bind('getPatientForUser'));

// Real medical profile data (allergies, conditions, medications)
router.get('/patient-profile/:patientId', bind('getPatientProfile'));

// Get default hospital (fallback when doctor has no hospitalId)
router.get('/default-hospital', bind('getDefaultHospital'));

// Get upcoming appointments
router.get('/upcoming', bind('getUpcomingAppointments'));

// Get appointments for patient
router.get('/patient/:patientId', bind('getPatientAppointments'));

// Get appointments for doctor
router.get('/doctor/:doctorId', bind('getDoctorAppointments'));

// Create new appointment
router.post('/', bind('createAppointment'));

// Update appointment status
router.patch('/:id/status', bind('updateAppointmentStatus'));

// Generate meeting link for online consultation
router.post('/:id/meeting', bind('generateMeetingLink'));

export default router;
