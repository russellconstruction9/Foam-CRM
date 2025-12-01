// Neon REST API integration
import { CustomerInfo } from '../components/EstimatePDF';
import { EstimateRecord, InventoryItem } from './db';
import { Employee, TimeEntry, Task, Automation } from '../components/types';

// Get API base URL from environment or use default
const NEON_API_BASE = import.meta.env.VITE_NEON_API_BASE || 
  'https://ep-lingering-hall-aeapbk2l.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1';

// Stack Auth configuration
const STACK_PROJECT_ID = import.meta.env.VITE_STACK_PROJECT_ID || 
  import.meta.env.NEXT_PUBLIC_STACK_PROJECT_ID || '';
const STACK_PUBLISHABLE_KEY = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || 
  import.meta.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || '';

// Optional: API key for additional authentication
const API_KEY = import.meta.env.VITE_NEON_API_KEY || '';

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${NEON_API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization if API key is configured
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }
  
  // Add Stack Auth headers if configured
  if (STACK_PROJECT_ID && STACK_PUBLISHABLE_KEY) {
    headers['X-Stack-Project-Id'] = STACK_PROJECT_ID;
    headers['X-Stack-Publishable-Key'] = STACK_PUBLISHABLE_KEY;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
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

// --- Job/Estimate Operations ---
export const getJobs = async (): Promise<EstimateRecord[]> => {
  try {
    const result = await apiRequest('/estimates?order=created_at.desc');
    console.log('✅ Loaded jobs from Neon REST API:', result);
    return result.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      estimatePdf: row.estimate_pdf,
      materialOrderPdf: row.material_order_pdf,
      invoicePdf: row.invoice_pdf,
      estimateNumber: row.estimate_number,
      calcData: typeof row.calc_data === 'string' ? JSON.parse(row.calc_data) : row.calc_data,
      costsData: typeof row.costs_data === 'string' ? JSON.parse(row.costs_data) : row.costs_data,
      scopeOfWork: row.scope_of_work || '',
      status: row.status,
      createdAt: row.created_at || ''
    }));
  } catch (error) {
    console.error('❌ Failed to load jobs from REST API:', error);
    return [];
  }
};

export const addJob = async (jobData: Omit<EstimateRecord, 'id' | 'createdAt'>): Promise<EstimateRecord> => {
  try {
    const createdAt = new Date().toISOString();
    const [result] = await apiRequest('/estimates', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: jobData.customerId,
        estimate_pdf: jobData.estimatePdf,
        material_order_pdf: jobData.materialOrderPdf,
        invoice_pdf: jobData.invoicePdf || null,
        estimate_number: jobData.estimateNumber,
        calc_data: JSON.stringify(jobData.calcData),
        costs_data: JSON.stringify(jobData.costsData),
        scope_of_work: jobData.scopeOfWork,
        status: jobData.status,
        created_at: createdAt
      })
    });
    console.log('✅ Added job via REST API:', result);
    return {
      id: result.id,
      customerId: result.customer_id,
      estimatePdf: result.estimate_pdf,
      materialOrderPdf: result.material_order_pdf,
      invoicePdf: result.invoice_pdf,
      estimateNumber: result.estimate_number,
      calcData: typeof result.calc_data === 'string' ? JSON.parse(result.calc_data) : result.calc_data,
      costsData: typeof result.costs_data === 'string' ? JSON.parse(result.costs_data) : result.costs_data,
      scopeOfWork: result.scope_of_work || '',
      status: result.status,
      createdAt: result.created_at || ''
    };
  } catch (error) {
    console.error('❌ Failed to add job via REST API:', error);
    throw error;
  }
};

export const updateJob = async (jobId: number, updates: Partial<Omit<EstimateRecord, 'id'>>): Promise<EstimateRecord> => {
  try {
    const updateData: any = {};
    if (updates.customerId !== undefined) updateData.customer_id = updates.customerId;
    if (updates.estimatePdf !== undefined) updateData.estimate_pdf = updates.estimatePdf;
    if (updates.materialOrderPdf !== undefined) updateData.material_order_pdf = updates.materialOrderPdf;
    if (updates.invoicePdf !== undefined) updateData.invoice_pdf = updates.invoicePdf;
    if (updates.estimateNumber !== undefined) updateData.estimate_number = updates.estimateNumber;
    if (updates.calcData !== undefined) updateData.calc_data = JSON.stringify(updates.calcData);
    if (updates.costsData !== undefined) updateData.costs_data = JSON.stringify(updates.costsData);
    if (updates.scopeOfWork !== undefined) updateData.scope_of_work = updates.scopeOfWork;
    if (updates.status !== undefined) updateData.status = updates.status;

    const [result] = await apiRequest(`/estimates?id=eq.${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    console.log('✅ Updated job via REST API');
    return {
      id: result.id,
      customerId: result.customer_id,
      estimatePdf: result.estimate_pdf,
      materialOrderPdf: result.material_order_pdf,
      invoicePdf: result.invoice_pdf,
      estimateNumber: result.estimate_number,
      calcData: typeof result.calc_data === 'string' ? JSON.parse(result.calc_data) : result.calc_data,
      costsData: typeof result.costs_data === 'string' ? JSON.parse(result.costs_data) : result.costs_data,
      scopeOfWork: result.scope_of_work || '',
      status: result.status,
      createdAt: result.created_at || ''
    };
  } catch (error) {
    console.error('❌ Failed to update job via REST API:', error);
    throw error;
  }
};

export const deleteJob = async (jobId: number): Promise<void> => {
  try {
    await apiRequest(`/estimates?id=eq.${jobId}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted job via REST API');
  } catch (error) {
    console.error('❌ Failed to delete job via REST API:', error);
    throw error;
  }
};

export const getEstimatesForCustomer = async (customerId: number): Promise<EstimateRecord[]> => {
  try {
    const result = await apiRequest(`/estimates?customer_id=eq.${customerId}&order=created_at.desc`);
    return result.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      estimatePdf: row.estimate_pdf,
      materialOrderPdf: row.material_order_pdf,
      invoicePdf: row.invoice_pdf,
      estimateNumber: row.estimate_number,
      calcData: typeof row.calc_data === 'string' ? JSON.parse(row.calc_data) : row.calc_data,
      costsData: typeof row.costs_data === 'string' ? JSON.parse(row.costs_data) : row.costs_data,
      scopeOfWork: row.scope_of_work || '',
      status: row.status,
      createdAt: row.created_at || ''
    }));
  } catch (error) {
    console.error('❌ Failed to load estimates for customer:', error);
    return [];
  }
};

// --- Employee Operations ---
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const result = await apiRequest('/employees?order=name.asc');
    console.log('✅ Loaded employees from Neon REST API:', result);
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      role: row.role || '',
      pin: row.pin || '0000'
    }));
  } catch (error) {
    console.error('❌ Failed to load employees from REST API:', error);
    return [];
  }
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  try {
    const [result] = await apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify({
        name: employee.name,
        role: employee.role || '',
        pin: employee.pin || '0000'
      })
    });
    console.log('✅ Added employee via REST API:', result);
    return {
      id: result.id,
      name: result.name,
      role: result.role || '',
      pin: result.pin || '0000'
    };
  } catch (error) {
    console.error('❌ Failed to add employee via REST API:', error);
    throw error;
  }
};

export const updateEmployee = async (id: number, updates: Partial<Omit<Employee, 'id'>>): Promise<Employee> => {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.pin !== undefined) updateData.pin = updates.pin;

    const [result] = await apiRequest(`/employees?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    console.log('✅ Updated employee via REST API');
    return {
      id: result.id,
      name: result.name,
      role: result.role || '',
      pin: result.pin || '0000'
    };
  } catch (error) {
    console.error('❌ Failed to update employee via REST API:', error);
    throw error;
  }
};

export const deleteEmployee = async (id: number): Promise<void> => {
  try {
    await apiRequest(`/employees?id=eq.${id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted employee via REST API');
  } catch (error) {
    console.error('❌ Failed to delete employee via REST API:', error);
    throw error;
  }
};

// --- Inventory Operations ---
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const result = await apiRequest('/inventory?order=name.asc');
    console.log('✅ Loaded inventory from Neon REST API:', result);
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category || '',
      quantity: row.quantity || 0,
      unitCost: row.unit_cost,
      notes: row.notes
    }));
  } catch (error) {
    console.error('❌ Failed to load inventory from REST API:', error);
    return [];
  }
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  try {
    const [result] = await apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: item.name,
        category: item.category || '',
        quantity: item.quantity || 0,
        unit_cost: item.unitCost,
        notes: item.notes
      })
    });
    console.log('✅ Added inventory item via REST API:', result);
    return {
      id: result.id,
      name: result.name,
      category: result.category || '',
      quantity: result.quantity || 0,
      unitCost: result.unit_cost,
      notes: result.notes
    };
  } catch (error) {
    console.error('❌ Failed to add inventory item via REST API:', error);
    throw error;
  }
};

export const updateInventoryItem = async (item: InventoryItem): Promise<void> => {
  try {
    await apiRequest(`/inventory?id=eq.${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: item.name,
        category: item.category || '',
        quantity: item.quantity || 0,
        unit_cost: item.unitCost,
        notes: item.notes
      })
    });
    console.log('✅ Updated inventory item via REST API');
  } catch (error) {
    console.error('❌ Failed to update inventory item via REST API:', error);
    throw error;
  }
};

export const deleteInventoryItem = async (itemId: number): Promise<void> => {
  try {
    await apiRequest(`/inventory?id=eq.${itemId}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted inventory item via REST API');
  } catch (error) {
    console.error('❌ Failed to delete inventory item via REST API:', error);
    throw error;
  }
};

// --- Task Operations ---
export const getTasks = async (): Promise<Task[]> => {
  try {
    const result = await apiRequest('/tasks?order=created_at.desc');
    console.log('✅ Loaded tasks from Neon REST API:', result);
    return result.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      completed: row.completed || false,
      assignedTo: row.assigned_to ? (typeof row.assigned_to === 'string' ? JSON.parse(row.assigned_to) : row.assigned_to) : [],
      createdAt: row.created_at,
      completedAt: row.completed_at
    }));
  } catch (error) {
    console.error('❌ Failed to load tasks from REST API:', error);
    return [];
  }
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  try {
    const createdAt = new Date().toISOString();
    const [result] = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        completed: task.completed || false,
        assigned_to: JSON.stringify(task.assignedTo || []),
        created_at: createdAt,
        completed_at: task.completedAt
      })
    });
    console.log('✅ Added task via REST API:', result);
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      dueDate: result.due_date,
      completed: result.completed || false,
      assignedTo: result.assigned_to ? (typeof result.assigned_to === 'string' ? JSON.parse(result.assigned_to) : result.assigned_to) : [],
      createdAt: result.created_at,
      completedAt: result.completed_at
    };
  } catch (error) {
    console.error('❌ Failed to add task via REST API:', error);
    throw error;
  }
};

export const updateTask = async (task: Task): Promise<void> => {
  try {
    await apiRequest(`/tasks?id=eq.${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        completed: task.completed || false,
        assigned_to: JSON.stringify(task.assignedTo || []),
        completed_at: task.completedAt
      })
    });
    console.log('✅ Updated task via REST API');
  } catch (error) {
    console.error('❌ Failed to update task via REST API:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    await apiRequest(`/tasks?id=eq.${taskId}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted task via REST API');
  } catch (error) {
    console.error('❌ Failed to delete task via REST API:', error);
    throw error;
  }
};

// --- Automation Operations ---
export const getAutomations = async (): Promise<Automation[]> => {
  try {
    const result = await apiRequest('/automations?order=name.asc');
    console.log('✅ Loaded automations from Neon REST API:', result);
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      trigger_type: row.trigger_type,
      trigger_config: row.trigger_config ? (typeof row.trigger_config === 'string' ? JSON.parse(row.trigger_config) : row.trigger_config) : {},
      action_type: row.action_type,
      action_config: row.action_config ? (typeof row.action_config === 'string' ? JSON.parse(row.action_config) : row.action_config) : {},
      is_enabled: row.is_enabled || false
    }));
  } catch (error) {
    console.error('❌ Failed to load automations from REST API:', error);
    return [];
  }
};

export const addAutomation = async (automation: Omit<Automation, 'id'>): Promise<Automation> => {
  try {
    const [result] = await apiRequest('/automations', {
      method: 'POST',
      body: JSON.stringify({
        name: automation.name,
        trigger_type: automation.trigger_type,
        trigger_config: JSON.stringify(automation.trigger_config),
        action_type: automation.action_type,
        action_config: JSON.stringify(automation.action_config),
        is_enabled: automation.is_enabled || false
      })
    });
    console.log('✅ Added automation via REST API:', result);
    return {
      id: result.id,
      name: result.name,
      trigger_type: result.trigger_type,
      trigger_config: result.trigger_config ? (typeof result.trigger_config === 'string' ? JSON.parse(result.trigger_config) : result.trigger_config) : {},
      action_type: result.action_type,
      action_config: result.action_config ? (typeof result.action_config === 'string' ? JSON.parse(result.action_config) : result.action_config) : {},
      is_enabled: result.is_enabled || false
    };
  } catch (error) {
    console.error('❌ Failed to add automation via REST API:', error);
    throw error;
  }
};

export const updateAutomation = async (automation: Automation): Promise<void> => {
  try {
    await apiRequest(`/automations?id=eq.${automation.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: automation.name,
        trigger_type: automation.trigger_type,
        trigger_config: JSON.stringify(automation.trigger_config),
        action_type: automation.action_type,
        action_config: JSON.stringify(automation.action_config),
        is_enabled: automation.is_enabled || false
      })
    });
    console.log('✅ Updated automation via REST API');
  } catch (error) {
    console.error('❌ Failed to update automation via REST API:', error);
    throw error;
  }
};

export const deleteAutomation = async (automationId: number): Promise<void> => {
  try {
    await apiRequest(`/automations?id=eq.${automationId}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted automation via REST API');
  } catch (error) {
    console.error('❌ Failed to delete automation via REST API:', error);
    throw error;
  }
};

// --- Time Entry Operations ---
export const getTimeEntriesForJob = async (jobId: number): Promise<TimeEntry[]> => {
  try {
    const result = await apiRequest(`/time_entries?job_id=eq.${jobId}`);
    return result.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      jobId: row.job_id,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      notes: row.notes
    }));
  } catch (error) {
    console.error('❌ Failed to load time entries for job:', error);
    return [];
  }
};

export const getTimeEntriesForEmployee = async (employeeId: number): Promise<TimeEntry[]> => {
  try {
    const result = await apiRequest(`/time_entries?employee_id=eq.${employeeId}`);
    return result.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      jobId: row.job_id,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      notes: row.notes
    }));
  } catch (error) {
    console.error('❌ Failed to load time entries for employee:', error);
    return [];
  }
};

export const getActiveTimeEntry = async (employeeId: number): Promise<TimeEntry | undefined> => {
  try {
    const result = await apiRequest(`/time_entries?employee_id=eq.${employeeId}&end_time=is.null`);
    if (result && result.length > 0) {
      const row = result[0];
      return {
        id: row.id,
        employeeId: row.employee_id,
        jobId: row.job_id,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration,
        notes: row.notes
      };
    }
    return undefined;
  } catch (error) {
    console.error('❌ Failed to load active time entry:', error);
    return undefined;
  }
};

export const saveTimeEntry = async (entry: Omit<TimeEntry, 'id'>): Promise<number> => {
  try {
    const [result] = await apiRequest('/time_entries', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: entry.employeeId,
        job_id: entry.jobId,
        start_time: entry.startTime,
        end_time: entry.endTime,
        duration: entry.duration,
        notes: entry.notes
      })
    });
    console.log('✅ Saved time entry via REST API:', result);
    return result.id;
  } catch (error) {
    console.error('❌ Failed to save time entry via REST API:', error);
    throw error;
  }
};