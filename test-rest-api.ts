// Test script for Neon REST API
import { testConnection, getCustomers, getEmployees, getJobs } from './lib/neon-rest-api';

async function testNeonRestAPI() {
  console.log('🔍 Testing Neon REST API Connection...\n');

  try {
    // Test basic connection
    console.log('1. Testing connection...');
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Connection successful!\n');
    } else {
      console.log('❌ Connection failed!\n');
      return;
    }

    // Test customer operations
    console.log('2. Testing customer operations...');
    const customers = await getCustomers();
    console.log(`   Found ${customers.length} customers`);
    if (customers.length > 0) {
      console.log(`   Sample: ${customers[0].name}`);
    }
    console.log('');

    // Test employee operations
    console.log('3. Testing employee operations...');
    const employees = await getEmployees();
    console.log(`   Found ${employees.length} employees`);
    if (employees.length > 0) {
      console.log(`   Sample: ${employees[0].name}`);
    }
    console.log('');

    // Test job operations
    console.log('4. Testing job operations...');
    const jobs = await getJobs();
    console.log(`   Found ${jobs.length} jobs/estimates`);
    if (jobs.length > 0) {
      console.log(`   Sample: Estimate #${jobs[0].estimateNumber}`);
    }
    console.log('');

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testNeonRestAPI();
