#!/usr/bin/env node

/**
 * Check PostgreSQL database status without requiring pg_isready
 * This script works on Windows and doesn't need PostgreSQL client tools
 */

const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || process.env.DB_USER || 'healthcare_user',
  password: process.env.DB_PASSWORD || 'healthcare_pass_123',
  database: process.env.DB_NAME || 'healthcare_plus',
  connectionTimeoutMillis: 5000,
};

async function checkDatabase() {
  console.log('🔍 Checking PostgreSQL database status...\n');

  const client = new Client(dbConfig);

  try {
    console.log('📡 Attempting to connect...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}\n`);

    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!\n');

    // Get database version
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:');
    console.log(`   ${versionResult.rows[0].version.split(',')[0]}\n`);

    // Get database size
    const sizeResult = await client.query(
      "SELECT pg_size_pretty(pg_database_size($1)) as size",
      [dbConfig.database]
    );
    console.log(`💾 Database Size: ${sizeResult.rows[0].size}\n`);

    // List tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('📋 Tables in database:');
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found in database');
    }

    console.log('\n✅ Database is ready and operational!');

  } catch (error) {
    console.error('\n❌ Failed to connect to PostgreSQL');
    console.error(`   Error: ${error.message}\n`);

    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure Docker containers are running:');
    console.log('      docker-compose ps');
    console.log('   2. Start PostgreSQL if not running:');
    console.log('      docker-compose up -d postgres');
    console.log('   3. Check if PostgreSQL is ready:');
    console.log('      docker-compose logs postgres');
    console.log('   4. Verify connection details in .env file');
    console.log('   5. On Windows, you can also use:');
    console.log('      .\\scripts\\check-db.ps1');

    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDatabase();

