// Script to initialize the Neon database schema
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function initializeSchema() {
  try {
    console.log('🚀 Initializing Neon database schema...');
    
    // Read the SQL schema file
    const schema = fs.readFileSync('./database.sql', 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        console.log('Executing:', trimmed.substring(0, 50) + '...');
        await sql.unsafe(trimmed);
      }
    }
    
    console.log('✅ Database schema initialized successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 Created tables:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Schema initialization failed:', error);
  }
}

initializeSchema();