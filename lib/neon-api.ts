import { sql, db, initializeDatabase } from './neon-db';
import { CustomerInfo } from '../components/EstimatePDF';

// Initialize the database connection
let dbInitialized = false;
const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

// --- Customer Operations ---
export const getCustomers = async (): Promise<CustomerInfo[]> => {
  await ensureDbInitialized();
  const results = await sql`SELECT * FROM customers ORDER BY name`;
  return results.map((row: any) => ({
    id: row.id,
    name: row.name,
    address: row.address || '',
    email: row.email || '',
    phone: row.phone || ''
  }));
};

export const addCustomer = async (customer: Omit<CustomerInfo, 'id'>): Promise<CustomerInfo> => {
  await ensureDbInitialized();
  const [result] = await sql`
    INSERT INTO customers (name, address, email, phone) 
    VALUES (${customer.name}, ${customer.address || ''}, ${customer.email || ''}, ${customer.phone || ''})
    RETURNING *
  `;
  return {
    id: result.id,
    name: result.name,
    address: result.address || '',
    email: result.email || '',
    phone: result.phone || ''
  };
};

export const updateCustomer = async (customer: CustomerInfo): Promise<void> => {
  await ensureDbInitialized();
  await sql`
    UPDATE customers 
    SET name = ${customer.name}, 
        address = ${customer.address || ''}, 
        email = ${customer.email || ''}, 
        phone = ${customer.phone || ''}
    WHERE id = ${customer.id}
  `;
};

// Placeholder functions for other operations (to be implemented)
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