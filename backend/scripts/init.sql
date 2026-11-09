-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable RLS (Row Level Security) for HIPAA compliance
ALTER DATABASE healthcare_plus SET row_security = on;

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'radiologist', 'nurse', 'technician', 'patient');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE image_modality AS ENUM ('xray', 'ct', 'mri', 'ultrasound', 'mammogram', 'pet', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE image_status AS ENUM ('uploading', 'uploaded', 'processing', 'analyzed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin user (password: Admin@123)
INSERT INTO users (id, email, password, first_name, last_name, role, status, email_verified_at, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'admin@healthcare.com',
    crypt('Admin@123', gen_salt('bf', 12)),
    'System',
    'Administrator',
    'admin'::user_role,
    'active'::user_status,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_images_patient_id ON medical_images(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_images_status ON medical_images(status);
CREATE INDEX IF NOT EXISTS idx_medical_images_created_at ON medical_images(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit.audit_logs(user_id);