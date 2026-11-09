# Database

PostgreSQL 15. Nine tables.

## Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    blood_group VARCHAR(5),
    emergency_contact VARCHAR(20),
    medical_history TEXT,
    allergies TEXT[],
    medications TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE indian_hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    phone VARCHAR(20),
    type VARCHAR(50) CHECK (type IN ('Government', 'Private', 'Trust', 'Clinic')),
    beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    emergency_services BOOLEAN DEFAULT false,
    ayushman_bharat BOOLEAN DEFAULT false,
    specialties TEXT[],
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    qualification TEXT[],
    experience_years INTEGER,
    hospital_id INTEGER REFERENCES indian_hospitals(id) ON DELETE SET NULL,
    consultation_fee DECIMAL(8,2),
    available_days TEXT[],
    available_hours VARCHAR(100),
    languages TEXT[],
    rating DECIMAL(3,2),
    phone VARCHAR(20),
    email VARCHAR(100),
    bio TEXT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES indian_hospitals(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
    symptoms TEXT,
    consultation_type VARCHAR(20) CHECK (consultation_type IN ('Online', 'In-Person')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50),
    metric_value DECIMAL(10,2),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    message_text TEXT,
    sender VARCHAR(20) CHECK (sender IN ('User', 'AI')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_hospitals_city ON indian_hospitals(city);
CREATE INDEX idx_hospitals_state ON indian_hospitals(state);
CREATE INDEX idx_hospitals_coordinates ON indian_hospitals(latitude, longitude);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_metrics_user ON health_metrics(user_id);
```

## Seed Data

The seed script populates 50+ real Indian hospitals across Delhi, Mumbai, Chennai, Bangalore, Kolkata, and other cities. It also seeds 15+ verified doctor profiles across specialties including Cardiology, Neurology, Dermatology, Pediatrics, Orthopedics, Gynecology, and General Medicine.
