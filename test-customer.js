// Test adding a customer
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function testCustomer() {
  try {
    console.log('🧪 Testing customer operations...');
    
    // Add a test customer
    const [customer] = await sql`
      INSERT INTO customers (name, address, email, phone) 
      VALUES ('Test Customer', '123 Main St', 'test@example.com', '555-0123')
      RETURNING *
    `;
    
    console.log('✅ Customer added:', customer);
    
    // Get all customers
    const customers = await sql`SELECT * FROM customers ORDER BY name`;
    console.log('📋 All customers:', customers);
    
  } catch (error) {
    console.error('❌ Customer test failed:', error);
  }
}

testCustomer();