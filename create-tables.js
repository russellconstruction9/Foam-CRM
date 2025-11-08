// Script to create tables one by one
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  try {
    console.log('🚀 Creating database tables...');
    
    // Create customers table
    console.log('Creating customers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create job_status enum
    console.log('Creating job_status enum...');
    await sql`
      CREATE TYPE job_status AS ENUM ('estimate', 'sold', 'invoiced', 'paid')
    `;
    
    // Create estimates table
    console.log('Creating estimates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS estimates (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        estimate_pdf BYTEA,
        material_order_pdf BYTEA,
        invoice_pdf BYTEA,
        estimate_number VARCHAR(100) NOT NULL UNIQUE,
        calc_data JSONB,
        costs_data JSONB,
        scope_of_work TEXT,
        status job_status DEFAULT 'estimate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create employees table
    console.log('Creating employees table...');
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        hourly_rate DECIMAL(10,2),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('✅ Tables created successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name != 'playing_with_neon'
      ORDER BY table_name
    `;
    
    console.log('📋 Created tables:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
  }
}

createTables();