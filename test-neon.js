// Simple test script to check Neon connection
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('Testing Neon connection...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Connection successful!', result[0]);
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Existing tables:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();