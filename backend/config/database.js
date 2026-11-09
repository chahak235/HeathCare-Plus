const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // ✅ Railway / Production
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log('🔗 Using DATABASE_URL for PostgreSQL connection');
} else {
  // ✅ Local development fallback
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'healthcare_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
  });

  console.log('💻 Using local PostgreSQL configuration');
}

// Test connection
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL Database Connected Successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database Connection Failed:', err.message);
  });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
  process.exit(1);
});

module.exports = pool;
