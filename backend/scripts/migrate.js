const { Pool } = require('pg');
require('dotenv').config();

async function migrate() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default database first
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');
    
    // Check if database exists, create if not
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME || 'healthcare_db'}';`
    );
    
    if (dbCheck.rows.length === 0) {
      console.log('📁 Creating database...');
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'healthcare_db'};`);
      console.log('✅ Database created');
    } else {
      console.log('✅ Database already exists');
    }
    
    // Connect to the healthcare database
    await client.release();
    await pool.end();
    
    const healthcarePool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'healthcare_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });
    
    const healthcareClient = await healthcarePool.connect();
    
    // Create users table
    console.log('📊 Creating users table...');
    await healthcareClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Add indexes for performance
        CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
      );
    `);
    
    // Create index on email for faster lookups
    await healthcareClient.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
    // Create index on verification_token
    await healthcareClient.query(`
      CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
    `);
    
    // Create health_profiles table
    console.log('📊 Creating health_profiles table...');
    await healthcareClient.query(`
      CREATE TABLE IF NOT EXISTS health_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        age INTEGER CHECK (age >= 0 AND age <= 150),
        gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
        blood_type VARCHAR(5),
        height DECIMAL(5,2) CHECK (height > 0),
        weight DECIMAL(5,2) CHECK (weight > 0),
        bmi DECIMAL(5,2),
        medical_conditions TEXT,
        allergies TEXT,
        medications TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        insurance_provider VARCHAR(100),
        insurance_id VARCHAR(50),
        
        -- Add JSONB column for flexible health data
        health_metrics JSONB DEFAULT '{}',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Add foreign key constraint
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    // Create appointments table
    console.log('📊 Creating appointments table...');
    await healthcareClient.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'in-person', 'follow-up')),
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0),
        reason TEXT,
        symptoms TEXT,
        diagnosis TEXT,
        prescription TEXT,
        
        -- Video consultation specific
        meeting_link TEXT,
        
        -- In-person specific
        hospital_name VARCHAR(200),
        hospital_address TEXT,
        
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Composite indexes for common queries
        CONSTRAINT fk_user_appointment FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_doctor FOREIGN KEY (doctor_id) REFERENCES users(id)
      );
    `);
    
    // Create indexes for appointments
    await healthcareClient.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_for ON appointments(scheduled_for);
    `);
    
    // Create health_metrics table for tracking
    console.log('📊 Creating health_metrics table...');
    await healthcareClient.query(`
      CREATE TABLE IF NOT EXISTS health_metrics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        device_id VARCHAR(100),
        
        -- Add constraint for common health metrics
        CONSTRAINT valid_metric_type CHECK (metric_type IN (
          'heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic',
          'temperature', 'blood_sugar', 'oxygen_saturation', 'weight', 'height',
          'steps', 'sleep_hours', 'calories_burned'
        )),
        
        CONSTRAINT fk_user_metrics FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    // Create indexes for health_metrics
    await healthcareClient.query(`
      CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);
      CREATE INDEX IF NOT EXISTS idx_health_metrics_metric_type ON health_metrics(metric_type);
      CREATE INDEX IF NOT EXISTS idx_health_metrics_measured_at ON health_metrics(measured_at);
    `);
    
    // Create notifications table
    console.log('📊 Creating notifications table...');
    await healthcareClient.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('appointment', 'medication', 'health_tip', 'emergency', 'system')),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        is_read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_user_notifications FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    // Create indexes for notifications
    await healthcareClient.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `);
    
    console.log('🎉 Database migration completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('   • users');
    console.log('   • health_profiles');
    console.log('   • appointments');
    console.log('   • health_metrics');
    console.log('   • notifications');
    
    await healthcareClient.release();
    await healthcarePool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();