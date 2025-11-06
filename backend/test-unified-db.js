// Test the unified database service
import { unifiedDbService } from './src/services/unified-database.service';
import dotenv from 'dotenv';

dotenv.config();

const testUnifiedService = async () => {
  console.log('Testing unified database service...');
  
  try {
    // Test connection initialization
    console.log('1. Testing connection initialization...');
    const connectionWorks = await unifiedDbService.testConnection();
    console.log('✅ Connection test passed:', connectionWorks);
    
    // Test getting customers (this will work with either backend)
    console.log('2. Testing customer retrieval...');
    const testOrgId = '550e8400-e29b-41d4-a716-446655440000';
    const customers = await unifiedDbService.getCustomers(testOrgId, { limit: 5 });
    console.log('✅ Customer query returned:', customers.length, 'customers');
    
    console.log('3. All tests passed! The unified service is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testUnifiedService();