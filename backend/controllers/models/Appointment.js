// Shared PostgreSQL pool from backend/config/database.js
const pool = require('../../config/database');

class Appointment {
  // Create new appointment
  static async create(appointmentData) {
    const {
      user_id,
      doctor_id,
      type = 'video',
      scheduled_for,
      duration_minutes = 30,
      reason = '',
      symptoms = '',
      meeting_link = null,
      hospital_name = null,
      hospital_address = null
    } = appointmentData;

    const query = `
      INSERT INTO appointments (
        user_id, doctor_id, type, scheduled_for, duration_minutes,
        reason, symptoms, meeting_link, hospital_name, hospital_address,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
      RETURNING *
    `;

    const values = [
      user_id, doctor_id, type, scheduled_for, duration_minutes,
      reason, symptoms, meeting_link, hospital_name, hospital_address
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get appointments by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT a.*, 
             d.name as doctor_name,
             d.specialty as doctor_specialty,
             d.profile_image_url as doctor_image,
             d.consultation_fee,
             u.name as patient_name,
             u.email as patient_email
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.user_id = $1
      ORDER BY a.scheduled_for DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get appointments by doctor ID
  static async findByDoctorId(doctorId) {
    const query = `
      SELECT a.*, 
             u.name as patient_name,
             u.email as patient_email,
             u.phone as patient_phone
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.doctor_id = $1
      ORDER BY a.scheduled_for DESC
    `;
    const result = await pool.query(query, [doctorId]);
    return result.rows;
  }

  // Update appointment status
  static async updateStatus(appointmentId, status) {
    const query = `
      UPDATE appointments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, appointmentId]);
    return result.rows[0];
  }

  // Update meeting link
  static async updateMeetingLink(appointmentId, meetingLink) {
    const query = `
      UPDATE appointments 
      SET meeting_link = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [meetingLink, appointmentId]);
    return result.rows[0];
  }

  // Cancel appointment
  static async cancel(appointmentId) {
    return this.updateStatus(appointmentId, 'cancelled');
  }

  // Check doctor availability at specific time
  static async checkDoctorAvailability(doctorId, scheduledFor, durationMinutes = 30) {
    const query = `
      SELECT COUNT(*) as conflict_count
      FROM appointments
      WHERE doctor_id = $1
        AND status IN ('scheduled', 'confirmed')
        AND scheduled_for <= $2 + INTERVAL '${durationMinutes} minutes'
        AND scheduled_for + INTERVAL '1 minute' * duration_minutes >= $2
    `;
    
    const result = await pool.query(query, [doctorId, scheduledFor]);
    return parseInt(result.rows[0].conflict_count) === 0;
  }

  // Get doctor's available time slots for a specific day
  static async getDoctorAvailableSlots(doctorId, date) {
    const query = `
      SELECT scheduled_for
      FROM appointments
      WHERE doctor_id = $1
        AND DATE(scheduled_for) = DATE($2)
        AND status IN ('scheduled', 'confirmed')
      ORDER BY scheduled_for
    `;
    
    const result = await pool.query(query, [doctorId, date]);
    return result.rows;
  }
}

module.exports = Appointment;