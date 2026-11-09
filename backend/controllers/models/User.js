const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class User {
  // Create new user
  static async create({ name, email, phone, password }) {
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('Email already registered');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert user (set is_verified to true for development)
      const result = await client.query(
        `INSERT INTO users (name, email, phone, password, is_verified) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, email, phone, role, is_verified, created_at`,
        [name, email, phone, hashedPassword, true]
      );

      const userId = result.rows[0].id;

      // Create health profile for the user
      await client.query(
        `INSERT INTO health_profiles (user_id) VALUES ($1)`,
        [userId]
      );

      // Commit transaction
      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('User.create error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, phone, password, role, is_verified, 
                created_at, updated_at 
         FROM users WHERE email = $1`,
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('User.findByEmail error:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, phone, role, is_verified, 
                created_at, updated_at 
         FROM users WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('User.findById error:', error);
      throw error;
    }
  }

  // Get user with health profile
  static async getUserWithProfile(userId) {
    try {
      const result = await pool.query(
        `SELECT 
            u.id, u.name, u.email, u.phone, u.role, u.is_verified,
            u.created_at, u.updated_at,
            hp.age, hp.gender, hp.blood_type, hp.height, hp.weight,
            hp.bmi, hp.medical_conditions, hp.allergies, hp.medications,
            hp.emergency_contact_name, hp.emergency_contact_phone,
            hp.insurance_provider, hp.insurance_id, hp.health_metrics
         FROM users u
         LEFT JOIN health_profiles hp ON u.id = hp.user_id
         WHERE u.id = $1`,
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('User.getUserWithProfile error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId, profileData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update basic user info if provided
      if (profileData.name || profileData.phone) {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (profileData.name) {
          updates.push(`name = $${paramCount}`);
          values.push(profileData.name);
          paramCount++;
        }

        if (profileData.phone) {
          updates.push(`phone = $${paramCount}`);
          values.push(profileData.phone);
          paramCount++;
        }

        if (updates.length > 0) {
          values.push(userId);
          await client.query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${paramCount}`,
            values
          );
        }
      }

      // Update or insert health profile
      const healthProfile = await client.query(
        'SELECT id FROM health_profiles WHERE user_id = $1',
        [userId]
      );

      const healthProfileData = {
        age: profileData.age,
        gender: profileData.gender,
        blood_type: profileData.bloodType,
        height: profileData.height,
        weight: profileData.weight,
        bmi: profileData.bmi,
        medical_conditions: profileData.medicalConditions,
        allergies: profileData.allergies,
        medications: profileData.medications,
        emergency_contact_name: profileData.emergencyContactName,
        emergency_contact_phone: profileData.emergencyContactPhone,
        insurance_provider: profileData.insuranceProvider,
        insurance_id: profileData.insuranceId,
      };

      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(healthProfileData).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(filteredData).length > 0) {
        if (healthProfile.rows.length > 0) {
          // Update existing profile
          const updates = [];
          const values = [];
          let paramCount = 1;

          Object.entries(filteredData).forEach(([key, value]) => {
            updates.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
          });

          values.push(userId);
          await client.query(
            `UPDATE health_profiles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $${paramCount}`,
            values
          );
        } else {
          // Insert new profile
          const columns = ['user_id', ...Object.keys(filteredData)];
          const placeholders = columns.map((_, i) => `$${i + 1}`);
          const values = [userId, ...Object.values(filteredData)];

          await client.query(
            `INSERT INTO health_profiles (${columns.join(', ')}) 
             VALUES (${placeholders.join(', ')})`,
            values
          );
        }
      }

      await client.query('COMMIT');

      // Return updated user
      return await this.getUserWithProfile(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('User.updateProfile error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('User.verifyPassword error:', error);
      throw error;
    }
  }

  // Generate JWT token
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'patient'
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Validate JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this');
    } catch (error) {
      console.error('User.verifyToken error:', error);
      throw error;
    }
  }

  // Update password
  static async updatePassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );
      
      return true;
    } catch (error) {
      console.error('User.updatePassword error:', error);
      throw error;
    }
  }
}

module.exports = User;