const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

async function seedDemoUsers() {
  console.log('🌱 Seeding demo users...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Demo users with their credentials
    const demoUsers = [
      {
        name: 'Demo Patient',
        email: 'patient@example.com',
        phone: '+12345678901',
        password: 'Test123!',
        role: 'patient'
      },
      {
        name: 'Dr. Johnson',
        email: 'dr.johnson@healthcare.com',
        phone: '+12345678902',
        password: 'Doctor123!',
        role: 'doctor'
      },
      {
        name: 'System Admin',
        email: 'admin@healthcare.com',
        phone: '+12345678903',
        password: 'Admin123!',
        role: 'admin'
      }
    ];

    for (const userData of demoUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Check if user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        // Update existing user's password
        console.log(`🔄 Updating password for ${userData.email}...`);
        await client.query(
          'UPDATE users SET password = $1, name = $2, phone = $3, role = $4, is_verified = $5, updated_at = CURRENT_TIMESTAMP WHERE email = $6',
          [hashedPassword, userData.name, userData.phone, userData.role, true, userData.email]
        );
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        // Create new user
        console.log(`➕ Creating user: ${userData.email}...`);
        const result = await client.query(
          `INSERT INTO users (name, email, phone, password, role, is_verified) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING id, name, email, role`,
          [userData.name, userData.email, userData.phone, hashedPassword, userData.role, true]
        );

        const userId = result.rows[0].id;

        // Create health profile for the user (check if exists first)
        const profileCheck = await client.query(
          'SELECT id FROM health_profiles WHERE user_id = $1',
          [userId]
        );
        
        if (profileCheck.rows.length === 0) {
          await client.query(
            `INSERT INTO health_profiles (user_id) VALUES ($1)`,
            [userId]
          );
        }

        console.log(`✅ Created user: ${userData.email} (ID: ${userId})`);
      }
    }

    await client.query('COMMIT');
    console.log('\n🎉 Demo users seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Patient: patient@example.com / Test123!');
    console.log('   Doctor:  dr.johnson@healthcare.com / Doctor123!');
    console.log('   Admin:   admin@healthcare.com / Admin123!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding demo users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoUsers()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoUsers };
