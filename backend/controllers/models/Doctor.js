// Use the shared database config from backend/config/database.js
const db = require('../../config/database');

class Doctor {
  // Get all doctors with optional filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT d.*, 
               h.name as hospital_name,
               h.city as hospital_city,
               h.state as hospital_state
        FROM doctors d
        LEFT JOIN indian_hospitals h ON d.hospital_id = h.id
        WHERE 1=1
      `;
      
      const values = [];
      let paramCount = 1;
      
      // Apply filters
      if (filters.specialty) {
        query += ` AND d.specialty = $${paramCount}`;
        values.push(filters.specialty);
        paramCount++;
      }
      
      if (filters.city) {
        query += ` AND h.city = $${paramCount}`;
        values.push(filters.city);
        paramCount++;
      }
      
      if (filters.minExperience) {
        query += ` AND d.experience_years >= $${paramCount}`;
        values.push(filters.minExperience);
        paramCount++;
      }
      
      if (filters.maxFee) {
        query += ` AND d.consultation_fee <= $${paramCount}`;
        values.push(filters.maxFee);
        paramCount++;
      }
      
      // Add sorting
      query += ` ORDER BY d.rating DESC, d.experience_years DESC`;
      
      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
        paramCount++;
        
        if (filters.offset) {
          query += ` OFFSET $${paramCount}`;
          values.push(filters.offset);
        }
      }
      
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }
  
  // Search doctors by name or specialty
  static async search(searchTerm) {
    try {
      const query = `
        SELECT d.*, 
               h.name as hospital_name,
               h.city as hospital_city
        FROM doctors d
        LEFT JOIN indian_hospitals h ON d.hospital_id = h.id
        WHERE d.name ILIKE $1 
           OR d.specialty ILIKE $1
           OR d.qualification::text ILIKE $1
        ORDER BY d.rating DESC
        LIMIT 50
      `;
      
      const result = await db.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error searching doctors:', error);
      throw error;
    }
  }
  
  // Get doctor by ID
  static async findById(id) {
    try {
      const query = `
        SELECT d.*, 
               h.name as hospital_name,
               h.address as hospital_address,
               h.city as hospital_city,
               h.state as hospital_state,
               h.phone as hospital_phone
        FROM doctors d
        LEFT JOIN indian_hospitals h ON d.hospital_id = h.id
        WHERE d.id = $1
      `;
      
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching doctor by ID:', error);
      throw error;
    }
  }
  
  // Get all unique specialties
  static async getSpecialties() {
    try {
      const query = `
        SELECT DISTINCT specialty 
        FROM doctors 
        WHERE specialty IS NOT NULL 
        ORDER BY specialty
      `;
      
      const result = await db.query(query);
      return result.rows.map(row => row.specialty);
    } catch (error) {
      console.error('Error fetching specialties:', error);
      throw error;
    }
  }
  
  // Get doctors by specialty
  static async findBySpecialty(specialty) {
    try {
      const query = `
        SELECT d.*, 
               h.name as hospital_name,
               h.city as hospital_city
        FROM doctors d
        LEFT JOIN indian_hospitals h ON d.hospital_id = h.id
        WHERE d.specialty = $1
        ORDER BY d.rating DESC
      `;
      
      const result = await db.query(query, [specialty]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching doctors by specialty:', error);
      throw error;
    }
  }
  
  // Get top rated doctors
  static async getTopRated(limit = 10) {
    try {
      const query = `
        SELECT d.*, 
               h.name as hospital_name,
               h.city as hospital_city
        FROM doctors d
        LEFT JOIN indian_hospitals h ON d.hospital_id = h.id
        WHERE d.rating >= 4.0
        ORDER BY d.rating DESC, d.review_count DESC
        LIMIT $1
      `;
      
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching top rated doctors:', error);
      throw error;
    }
  }
  
  // Count total doctors
  static async count(filters = {}) {
    try {
      let query = `SELECT COUNT(*) FROM doctors d WHERE 1=1`;
      const values = [];
      let paramCount = 1;
      
      if (filters.specialty) {
        query += ` AND d.specialty = $${paramCount}`;
        values.push(filters.specialty);
        paramCount++;
      }
      
      if (filters.city) {
        query += ` AND EXISTS (
          SELECT 1 FROM indian_hospitals h 
          WHERE h.id = d.hospital_id AND h.city = $${paramCount}
        )`;
        values.push(filters.city);
        paramCount++;
      }
      
      const result = await db.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting doctors:', error);
      throw error;
    }
  }
}

module.exports = Doctor;