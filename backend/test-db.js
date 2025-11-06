// Simple database connection test
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].version);
    
    // Check if our tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'users', 'customers', 'jobs', 'employees')
    `);
    
    console.log('Existing tables:', tableCheck.rows.map(r => r.table_name));
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await pool.end();
  }
};

testConnection();