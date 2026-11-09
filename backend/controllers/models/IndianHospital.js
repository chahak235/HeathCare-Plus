const pool = require('../../config/database');

class IndianHospital {
  // Find hospitals by city
  static async findByCity(city, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT id, name, type, city, state, pincode, 
                latitude, longitude, phone, emergency_phone,
                specialty, beds, ayushman_empaneled,
                ROUND(CAST(latitude AS numeric), 4) as lat,
                ROUND(CAST(longitude AS numeric), 4) as lng
         FROM indian_hospitals 
         WHERE city ILIKE $1 AND is_active = true
         ORDER BY beds DESC
         LIMIT $2`,
        [`%${city}%`, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('IndianHospital.findByCity error:', error);
      throw error;
    }
  }

  // Find hospitals by state
  static async findByState(state, limit = 30) {
    try {
      const result = await pool.query(
        `SELECT id, name, type, city, state, pincode,
                latitude, longitude, phone, emergency_phone,
                specialty, beds, ayushman_empaneled,
                ROUND(CAST(latitude AS numeric), 4) as lat,
                ROUND(CAST(longitude AS numeric), 4) as lng
         FROM indian_hospitals 
         WHERE state ILIKE $1 AND is_active = true
         ORDER BY city, beds DESC
         LIMIT $2`,
        [`%${state}%`, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('IndianHospital.findByState error:', error);
      throw error;
    }
  }

  // Find hospitals near coordinates (within 50km)
  static async findNearby(lat, lng, radiusKm = 50, limit = 20) {
    try {
      // Simple bounding box search (for production, use PostGIS)
      const radiusDeg = radiusKm / 111.0; // Approximate conversion
      const minLat = lat - radiusDeg;
      const maxLat = lat + radiusDeg;
      const minLng = lng - radiusDeg;
      const maxLng = lng + radiusDeg;

      const result = await pool.query(
        `SELECT id, name, type, city, state, pincode,
                latitude, longitude, phone, emergency_phone,
                specialty, beds, ayushman_empaneled,
                ROUND(CAST(latitude AS numeric), 4) as lat,
                ROUND(CAST(longitude AS numeric), 4) as lng,
                ROUND(
                  (6371 * acos(
                    cos(radians($1)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(latitude))
                  ))::numeric, 2
                ) as distance_km
         FROM indian_hospitals 
         WHERE latitude BETWEEN $3 AND $4
           AND longitude BETWEEN $5 AND $6
           AND is_active = true
         ORDER BY distance_km
         LIMIT $7`,
        [lat, lng, minLat, maxLat, minLng, maxLng, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('IndianHospital.findNearby error:', error);
      throw error;
    }
  }

  // Search hospitals by name or specialty
  static async search(query, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT id, name, type, city, state, pincode,
                latitude, longitude, phone, emergency_phone,
                specialty, beds, ayushman_empaneled,
                ROUND(CAST(latitude AS numeric), 4) as lat,
                ROUND(CAST(longitude AS numeric), 4) as lng
         FROM indian_hospitals 
         WHERE (name ILIKE $1 OR specialty ILIKE $1 OR city ILIKE $1)
           AND is_active = true
         ORDER BY 
           CASE 
             WHEN name ILIKE $1 THEN 1
             WHEN city ILIKE $1 THEN 2
             ELSE 3
           END,
           beds DESC
         LIMIT $2`,
        [`%${query}%`, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('IndianHospital.search error:', error);
      throw error;
    }
  }

  // Get all unique states
  static async getStates() {
    try {
      const result = await pool.query(
        `SELECT DISTINCT state 
         FROM indian_hospitals 
         WHERE is_active = true
         ORDER BY state`
      );
      return result.rows.map(row => row.state);
    } catch (error) {
      console.error('IndianHospital.getStates error:', error);
      throw error;
    }
  }

  // Get cities by state
  static async getCitiesByState(state) {
    try {
      const result = await pool.query(
        `SELECT DISTINCT city 
         FROM indian_hospitals 
         WHERE state = $1 AND is_active = true
         ORDER BY city`,
        [state]
      );
      return result.rows.map(row => row.city);
    } catch (error) {
      console.error('IndianHospital.getCitiesByState error:', error);
      throw error;
    }
  }

  // Get hospital by ID
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM indian_hospitals WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('IndianHospital.findById error:', error);
      throw error;
    }
  }
}

module.exports = IndianHospital;