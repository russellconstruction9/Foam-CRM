import React, { useState, useEffect } from 'react';
import { apiService, customerApi, ApiError } from '../lib/api';
import { directSupabaseService } from '../lib/supabase-direct';

export const ApiTester: React.FC = () => {
  const [status, setStatus] = useState<string>('Checking connection...');
  const [connected, setConnected] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [supabaseCustomers, setSupabaseCustomers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      // Test backend connection
      const isConnected = await apiService.testConnection();
      setConnected(isConnected);
      
      // Test direct Supabase connection
      const supabaseConnectionWorking = await directSupabaseService.testConnection();
      setSupabaseConnected(supabaseConnectionWorking);
      
      if (isConnected) {
        setStatus('Backend connected!');
        // Try to get customers through backend
        try {
          const customerList = await customerApi.getAll();
          setCustomers(customerList);
          setStatus('Backend: Successfully connected and fetched data!');
        } catch (apiError) {
          if (apiError instanceof ApiError) {
            if (apiError.status === 401) {
              setStatus('Backend connected but needs authentication');
              setError('Authentication required - need to login first');
            } else {
              setError(`Backend API Error: ${apiError.message}`);
            }
          } else {
            setError(`Backend Unknown error: ${apiError}`);
          }
        }
      } else {
        setStatus('Backend not available');
      }

      if (supabaseConnectionWorking) {
        // Try to get customers directly from Supabase
        try {
          const supabaseCustomerList = await directSupabaseService.getCustomers();
          setSupabaseCustomers(supabaseCustomerList);
          setStatus(prev => prev + ' | Supabase: Direct connection working!');
        } catch (supabaseError) {
          setError(prev => `${prev || ''} | Supabase Error: ${supabaseError}`);
        }
      }
    } catch (err) {
      setConnected(false);
      setStatus('Connection failed');
      setError(`Connection error: ${err}`);
    }
  };

  const createTestData = async () => {
    try {
      const testCustomer = {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0123',
        address: '123 Test Street, Test City, TC 12345'
      };
      
      // Try creating through backend first
      try {
        const newCustomer = await customerApi.create(testCustomer);
        setStatus('Backend: Test customer created successfully!');
      } catch (backendError) {
        console.log('Backend creation failed, trying direct Supabase:', backendError);
        
        // Try creating directly through Supabase
        const newSupabaseCustomer = await directSupabaseService.createCustomer(testCustomer);
        setStatus('Supabase: Test customer created successfully!');
      }
      
      await checkConnection(); // Refresh the list
    } catch (error) {
      setError(`Failed to create test data: ${error}`);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: connected ? '#e8f5e8' : '#ffeaea'
    }}>
      <h3>API Connection Test</h3>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>Backend URL:</strong> http://localhost:3001</p>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={checkConnection}
          style={{ 
            padding: '8px 16px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Recheck Connection
        </button>
        
        <button 
          onClick={createTestData}
          disabled={!connected}
          style={{ 
            padding: '8px 16px',
            backgroundColor: connected ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: connected ? 'pointer' : 'not-allowed'
          }}
        >
          Create Test Data
        </button>
      </div>
      
      {customers.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4>Customers ({customers.length}):</h4>
          <ul>
            {customers.map((customer: any) => (
              <li key={customer.id}>
                {customer.name} - {customer.email} ({customer.created_at})
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <details style={{ marginTop: '15px' }}>
        <summary>Debug Info</summary>
        <pre style={{ fontSize: '12px', backgroundColor: '#f8f9fa', padding: '10px' }}>
          Connected: {connected.toString()}
          {'\n'}Error: {error || 'None'}
          {'\n'}Customers Count: {customers.length}
          {'\n'}API Base URL: http://localhost:3001/api
        </pre>
      </details>
    </div>
  );
};