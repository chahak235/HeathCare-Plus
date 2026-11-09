import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  console.log('🚀 Setting up PostgreSQL database for Healthcare AI...');

  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    const dbName = process.env.DB_NAME || 'healthcare_db';

    // Check if database exists
    const dbExists = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbExists.rows.length === 0) {
      console.log(`📁 Creating database: ${dbName}`);
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created');
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }

    await adminClient.end();

    // Connect to the new database
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: dbName,
    });

    await dbClient.connect();
    console.log(`📊 Connected to database: ${dbName}`);

    // Create users table
    console.log('📋 Creating users table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'patient',
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on email
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Users table created');

    // Create health_profiles table
    console.log('📋 Creating health_profiles table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS health_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        age INTEGER,
        gender VARCHAR(20),
        blood_type VARCHAR(5),
        height DECIMAL(5,2),
        weight DECIMAL(5,2),
        bmi DECIMAL(5,2),
        medical_conditions TEXT,
        allergies TEXT,
        medications TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        insurance_provider VARCHAR(100),
        insurance_id VARCHAR(50),
        health_metrics JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Health profiles table created');

    // Create appointments table
    console.log('📋 Creating appointments table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled',
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        reason TEXT,
        symptoms TEXT,
        diagnosis TEXT,
        prescription TEXT,
        meeting_link TEXT,
        hospital_name VARCHAR(200),
        hospital_address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for appointments
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_for ON appointments(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `);

    console.log('✅ Appointments table created');

    // Create health_metrics table
    console.log('📋 Creating health_metrics table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS health_metrics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        device_id VARCHAR(100)
      );
    `);

    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);
      CREATE INDEX IF NOT EXISTS idx_health_metrics_metric_type ON health_metrics(metric_type);
    `);

    console.log('✅ Health metrics table created');

    // Create notifications table
    console.log('📋 Creating notifications table...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        is_read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `);

    console.log('✅ Notifications table created');

    // Create a test user
    console.log('👤 Creating test user...');
    await dbClient.query(`
      INSERT INTO users (name, email, phone, password, is_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, [
      'Test Patient',
      'patient@example.com',
      '+12345678901',
      '$2a$10$dummyhashfortesting', // In production, use actual bcrypt hash
      true
    ]);

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Database Schema Summary:');
    console.log('   • users - User accounts and authentication');
    console.log('   • health_profiles - Medical profiles');
    console.log('   • appointments - Patient appointments');
    console.log('   • health_metrics - Health tracking data');
    console.log('   • notifications - User notifications');
    
    await dbClient.end();

  } catch (error: any) {
    console.error('❌ Error setting up database:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running:');
    console.log('   - macOS: brew services start postgresql');
    console.log('   - Linux: sudo systemctl start postgresql');
    console.log('2. Check PostgreSQL credentials in .env file');
    console.log('3. Default PostgreSQL password is often empty');
    console.log('4. Try connecting manually: psql -h localhost -U postgres');
    process.exit(1);
  }
}

setupDatabase();