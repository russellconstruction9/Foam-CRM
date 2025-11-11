

import { db, EstimateRecord, InventoryItem } from './db';
import { CustomerInfo } from '../components/EstimatePDF';
import { Employee, Task, Automation, TimeEntry } from '../components/types';

// Neon database integration (direct SQL connection)
let useNeonDb = false;
let neonInitialized = false;

// Stack Auth integration constants for future use
const STACK_AUTH_PROJECT_ID = '095d82e0-2079-42dd-a765-3e31745722cf';
const NEON_REST_API_BASE = 'https://ep-lingering-hall-aeapbk2l.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1';
const JWKS_URL = 'https://api.stack-auth.com/api/v1/projects/095d82e0-2079-42dd-a765-3e31745722cf/.well-known/jwks.json';

// Check if Neon database is available and configured
const checkNeonAvailability = () => {
  return !!(process.env.DATABASE_URL);
};

// This file acts as a service layer for all data operations.
// It uses either Neon PostgreSQL (via direct SQL) or Dexie.js for local storage.
// Future enhancement: Use Neon REST API with Stack Auth JWT tokens for better security.

// --- Customer Operations ---
export const getCustomers = async (): Promise<CustomerInfo[]> => {
  // Check if Neon should be used
  if (checkNeonAvailability() && !neonInitialized) {
    try {
      const { initializeDatabase } = await import('./neon-db');
      await initializeDatabase();
      useNeonDb = true;
      neonInitialized = true;
      console.log('✅ Using Neon PostgreSQL database');
    } catch (error) {
      console.log('⚠️ Neon database not available, using local Dexie database:', error);
      useNeonDb = false;
    }
  }

  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getCustomers();
    } catch (error) {
      console.error('❌ Neon query failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  
  return await db.customers.toArray();
};

export const addCustomer = async (customer: Omit<CustomerInfo, 'id'>): Promise<CustomerInfo> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.addCustomer(customer);
    } catch (error) {
      console.error('❌ Neon insert failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  
  const newId = await db.customers.add(customer as CustomerInfo);
  return { ...customer, id: newId };
};

export const updateCustomer = async (customer: CustomerInfo): Promise<void> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.updateCustomer(customer);
    } catch (error) {
      console.error('❌ Neon update failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  
  await db.customers.put(customer);
};

// --- Job/Estimate Operations ---
export const getJobs = async (): Promise<EstimateRecord[]> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getJobs();
    } catch (error) {
      console.error('❌ Neon getJobs failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return await db.estimates.orderBy('createdAt').reverse().toArray();
};

export const addJob = async (jobData: Omit<EstimateRecord, 'id' | 'createdAt'>): Promise<EstimateRecord> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.addJob(jobData);
    } catch (error) {
      console.error('❌ Neon addJob failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  
  const recordToSave: Omit<EstimateRecord, 'id'> = {
    ...jobData,
    createdAt: new Date().toISOString()
  };
  const id = await db.estimates.add(recordToSave as EstimateRecord);
  return { ...recordToSave, id };
};

export const updateJob = async (jobId: number, updates: Partial<Omit<EstimateRecord, 'id'>>): Promise<EstimateRecord> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.updateJob(jobId, updates);
    } catch (error) {
      console.error('❌ Neon updateJob failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  
  await db.estimates.update(jobId, updates);
  const updatedJob = await db.estimates.get(jobId);
  if (!updatedJob) throw new Error("Failed to find job after update.");
  return updatedJob;
};

export const deleteJob = async (jobId: number): Promise<void> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.deleteJob(jobId);
    } catch (error) {
      console.error('❌ Neon deleteJob failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  await db.estimates.delete(jobId);
};

export const getEstimatesForCustomer = async (customerId: number): Promise<EstimateRecord[]> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getEstimatesForCustomer(customerId);
    } catch (error) {
      console.error('❌ Neon getEstimatesForCustomer failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return db.estimates.where('customerId').equals(customerId).toArray();
};

// Helper function to get a single customer by ID
export const getCustomerById = async (id: number): Promise<CustomerInfo | null> => {
  console.log('API: getCustomerById called with ID:', id);
  if (useNeonDb) {
    try {
      const customers = await getCustomers();
      console.log('API: All customers from Neon:', customers.map(c => ({ id: c.id, name: c.name })));
      return customers.find(c => c.id === id) || null;
    } catch (error) {
      console.error('❌ Neon getCustomerById failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  const result = await db.customers.get(id) || null;
  console.log('API: Customer from Dexie:', result ? { id: result.id, name: result.name } : 'not found');
  return result;
};


// --- Employee Operations ---
export const getEmployees = async (): Promise<Employee[]> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getEmployees();
    } catch (error) {
      console.error('❌ Neon getEmployees failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return await db.employees.toArray();
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.addEmployee(employee);
    } catch (error) {
      console.error('❌ Neon addEmployee failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  const newId = await db.employees.add(employee as Employee);
  return { ...employee, id: newId };
};

export const updateEmployee = async (id: number, updates: Partial<Omit<Employee, 'id'>>): Promise<Employee> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.updateEmployee(id, updates);
    } catch (error) {
      console.error('❌ Neon updateEmployee failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  await db.employees.update(id, updates);
  const updatedEmployee = await db.employees.get(id);
  if (!updatedEmployee) throw new Error("Failed to find employee after update.");
  return updatedEmployee;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.deleteEmployee(id);
    } catch (error) {
      console.error('❌ Neon deleteEmployee failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  await db.employees.delete(id);
};

// --- Time Log Operations ---
export const getTimeEntriesForJob = async (jobId: number): Promise<TimeEntry[]> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getTimeEntriesForJob(jobId);
    } catch (error) {
      console.error('❌ Neon getTimeEntriesForJob failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return db.time_log.where('jobId').equals(jobId).toArray();
};

export const getTimeEntriesForEmployee = async (employeeId: number): Promise<TimeEntry[]> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getTimeEntriesForEmployee(employeeId);
    } catch (error) {
      console.error('❌ Neon getTimeEntriesForEmployee failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return db.time_log.where('employeeId').equals(employeeId).reverse().toArray();
};

export const getActiveTimeEntry = async (employeeId: number): Promise<TimeEntry | undefined> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getActiveTimeEntry(employeeId);
    } catch (error) {
      console.error('❌ Neon getActiveTimeEntry failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return db.time_log.where({ employeeId }).filter(entry => !entry.endTime).first();
};

export const saveTimeEntry = async (entry: TimeEntry): Promise<number> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.saveTimeEntry(entry);
    } catch (error) {
      console.error('❌ Neon saveTimeEntry failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return db.time_log.put(entry);
};

// --- Inventory Operations ---
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.getInventoryItems();
    } catch (error) {
      console.error('❌ Neon getInventoryItems failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  return await db.inventory.toArray();
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  if (useNeonDb) {
    try {
      const neonApi = await import('./neon-api');
      return await neonApi.addInventoryItem(item);
    } catch (error) {
      console.error('❌ Neon addInventoryItem failed, falling back to Dexie:', error);
      useNeonDb = false;
    }
  }
  const newId = await db.inventory.add(item as InventoryItem);
  return { ...item, id: newId };
};

export const updateInventoryItem = async (item: InventoryItem): Promise<void> => {
    await db.inventory.put(item);
};

export const deleteInventoryItem = async (itemId: number): Promise<void> => {
    await db.inventory.delete(itemId);
};

// --- Task Operations ---
export const getTasks = async (): Promise<Task[]> => {
    return await db.tasks.orderBy('createdAt').reverse().toArray();
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>): Promise<Task> => {
    const newTask: Omit<Task, 'id'> = {
        ...task,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    const newId = await db.tasks.add(newTask as Task);
    return { ...newTask, id: newId };
};

export const updateTask = async (task: Task): Promise<void> => {
    await db.tasks.put(task);
};

export const deleteTask = async (taskId: number): Promise<void> => {
    await db.tasks.delete(taskId);
};

// --- Automation Operations ---
export const getAutomations = async (): Promise<Automation[]> => {
    return await db.automations.toArray();
};

export const addAutomation = async (automation: Omit<Automation, 'id'>): Promise<Automation> => {
    const newId = await db.automations.add(automation as Automation);
    return { ...automation, id: newId };
};

export const updateAutomation = async (automation: Automation): Promise<void> => {
    await db.automations.put(automation);
};

export const deleteAutomation = async (automationId: number): Promise<void> => {
    await db.automations.delete(automationId);
};