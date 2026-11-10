import { Router, Request, Response } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { socketService as importedSocketService } from '../websocket';
import { getServices } from '../services';
import { authenticate } from '../middleware/auth.middleware';
import {
  ownUserParam,
  patientParamReadable,
  ownDoctorParam,
  canBookForBodyPatient,
  partyToAppointment,
  doctorOrStaff,
} from '../middleware/appointment-access';

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

// Public: anyone can see free slots and the booking calendar
router.get('/slots', bind('getAvailableSlots'));

// Open-slot counts per day for the booking calendar
router.get('/availability', bind('getAvailability'));

// Get patient ID for user (booking flow)
router.get('/patient-for-user/:userId', authenticate as any, ownUserParam as any, bind('getPatientForUser'));

// Real medical profile data (allergies, conditions, medications)
router.get('/patient-profile/:patientId', authenticate as any, patientParamReadable as any, bind('getPatientProfile'));

// Get default hospital (fallback when doctor has no hospitalId)
router.get('/default-hospital', bind('getDefaultHospital'));

// Get upcoming appointments
router.get('/upcoming', authenticate as any, doctorOrStaff as any, bind('getUpcomingAppointments'));

// Get appointments for patient
router.get('/patient/:patientId', authenticate as any, patientParamReadable as any, bind('getPatientAppointments'));

// Get appointments for doctor
router.get('/doctor/:doctorId', authenticate as any, ownDoctorParam as any, bind('getDoctorAppointments'));

// Create new appointment
router.post('/', authenticate as any, canBookForBodyPatient as any, bind('createAppointment'));

// Update appointment status
router.patch('/:id/status', authenticate as any, partyToAppointment as any, bind('updateAppointmentStatus'));

// Generate meeting link for online consultation
router.post('/:id/meeting', authenticate as any, partyToAppointment as any, bind('generateMeetingLink'));

export default router;
