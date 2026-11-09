const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointment.controller');
const authMiddleware = require('../middlewear/auth.middleware');

// All appointment routes require authentication
router.use(authMiddleware);

// Book new appointment
router.post('/book', AppointmentController.bookAppointment);

// Get user's appointments
router.get('/my-appointments', AppointmentController.getUserAppointments);

// Cancel appointment
router.put('/:id/cancel', AppointmentController.cancelAppointment);

module.exports = router;