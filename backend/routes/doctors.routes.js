const express = require('express');
const router = express.Router();
const doctorsController = require('../controllers/doctors.controller');
const AppointmentController = require('../controllers/appointment.controller');
const authMiddleware = require('../middlewear/auth.middleware');

// GET /api/doctors - Get all doctors with filters
router.get('/', doctorsController.getAllDoctors);

// GET /api/doctors/search - Search doctors
router.get('/search', doctorsController.searchDoctors);

// GET /api/doctors/top-rated - Get top rated doctors
router.get('/top-rated', doctorsController.getTopRatedDoctors);

// GET /api/doctors/specialties - Get all specialties
router.get('/specialties', doctorsController.getSpecialties);

// GET /api/doctors/specialty/:specialty - Get doctors by specialty
router.get('/specialty/:specialty', doctorsController.getDoctorsBySpecialty);

// GET /api/doctors/:id - Get doctor by ID
router.get('/:id', doctorsController.getDoctorById);

router.post('/:id/book', authMiddleware, AppointmentController.bookAppointment);
router.get('/:id/availability', AppointmentController.getDoctorAvailability);

module.exports = router;