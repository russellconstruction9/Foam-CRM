// Neon REST API integration
const NEON_API_BASE = 'https://ep-lingering-hall-aeapbk2l.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1';

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${NEON_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// Customer operations using REST API
export const getCustomers = async () => {
  try {
    const result = await apiRequest('/customers');
    console.log('✅ Loaded customers from Neon REST API:', result);
    return result.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      address: customer.address || '',
      email: customer.email || '',
      phone: customer.phone || ''
    }));
  } catch (error) {
    console.error('❌ Failed to load customers from REST API:', error);
    throw error;
  }
};

export const addCustomer = async (customer: { name: string; address: string; email: string; phone: string }) => {
  try {
    const result = await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: customer.name,
        address: customer.address || '',
        email: customer.email || '',
        phone: customer.phone || ''
      })
    });
    console.log('✅ Added customer via REST API:', result);
    return {
      id: result.id,
      name: result.name,
      address: result.address || '',
      email: result.email || '',
      phone: result.phone || ''
    };
  } catch (error) {
    console.error('❌ Failed to add customer via REST API:', error);
    throw error;
  }
};

export const updateCustomer = async (customer: { id: number; name: string; address: string; email: string; phone: string }) => {
  try {
    await apiRequest(`/customers?id=eq.${customer.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: customer.name,
        address: customer.address || '',
        email: customer.email || '',
        phone: customer.phone || ''
      })
    });
    console.log('✅ Updated customer via REST API');
  } catch (error) {
    console.error('❌ Failed to update customer via REST API:', error);
    throw error;
  }
};

// Test connection function
export const testConnection = async () => {
  try {
    await apiRequest('/customers?limit=1');
    console.log('✅ Neon REST API connection successful');
    return true;
  } catch (error) {
    console.log('❌ Neon REST API connection failed:', error);
    return false;
  }
};

// Placeholder functions for other operations
export const getJobs = async (): Promise<any[]> => { return []; };
export const addJob = async (jobData: any): Promise<any> => { throw new Error('Not implemented'); };
export const updateJob = async (jobId: number, updates: any): Promise<any> => { throw new Error('Not implemented'); };
export const deleteJob = async (jobId: number): Promise<void> => { throw new Error('Not implemented'); };
export const getEstimatesForCustomer = async (customerId: number): Promise<any[]> => { return []; };
export const getEmployees = async (): Promise<any[]> => { return []; };
export const addEmployee = async (employee: any): Promise<any> => { throw new Error('Not implemented'); };
export const getTimeEntriesForJob = async (jobId: number): Promise<any[]> => { return []; };
export const getTimeEntriesForEmployee = async (employeeId: number): Promise<any[]> => { return []; };
export const getActiveTimeEntry = async (employeeId: number): Promise<any> => { return undefined; };
export const saveTimeEntry = async (entry: any): Promise<number> => { throw new Error('Not implemented'); };
export const getInventoryItems = async (): Promise<any[]> => { return []; };
export const addInventoryItem = async (item: any): Promise<any> => { throw new Error('Not implemented'); };
export const updateInventoryItem = async (item: any): Promise<void> => { throw new Error('Not implemented'); };
export const deleteInventoryItem = async (itemId: number): Promise<void> => { throw new Error('Not implemented'); };
export const getTasks = async (): Promise<any[]> => { return []; };
export const addTask = async (task: any): Promise<any> => { throw new Error('Not implemented'); };
export const updateTask = async (task: any): Promise<void> => { throw new Error('Not implemented'); };
export const deleteTask = async (taskId: number): Promise<void> => { throw new Error('Not implemented'); };
export const getAutomations = async (): Promise<any[]> => { return []; };
export const addAutomation = async (automation: any): Promise<any> => { throw new Error('Not implemented'); };
export const updateAutomation = async (automation: any): Promise<void> => { throw new Error('Not implemented'); };
export const deleteAutomation = async (automationId: number): Promise<void> => { throw new Error('Not implemented'); };