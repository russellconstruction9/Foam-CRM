import React, { useState, useEffect } from 'react';
import { getCustomers, addCustomer } from '../lib/api';
import { CustomerInfo } from './EstimatePDF';

const DatabaseTest: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const customerList = await getCustomers();
      setCustomers(customerList);
      console.log('Loaded customers:', customerList);
    } catch (err) {
      setError('Failed to load customers: ' + (err as Error).message);
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const newCustomer = await addCustomer({
        name: newCustomerName,
        address: '123 Test St',
        email: 'test@example.com',
        phone: '555-0123'
      });
      console.log('Added customer:', newCustomer);
      setNewCustomerName('');
      await loadCustomers(); // Reload the list
    } catch (err) {
      setError('Failed to add customer: ' + (err as Error).message);
      console.error('Error adding customer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px' }}>
      <h3>Database Connection Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Customer name"
          value={newCustomerName}
          onChange={(e) => setNewCustomerName(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button 
          onClick={handleAddCustomer} 
          disabled={loading}
          style={{ padding: '5px 10px' }}
        >
          {loading ? 'Adding...' : 'Add Customer'}
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={loadCustomers} disabled={loading} style={{ padding: '5px 10px' }}>
          {loading ? 'Loading...' : 'Reload Customers'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}

      <div>
        <h4>Customers ({customers.length}):</h4>
        {customers.length === 0 ? (
          <p>No customers found</p>
        ) : (
          <ul>
            {customers.map((customer) => (
              <li key={customer.id}>
                <strong>{customer.name}</strong> - {customer.email} ({customer.phone})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DatabaseTest;