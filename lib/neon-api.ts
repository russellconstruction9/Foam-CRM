import { sql, db, initializeDatabase } from './neon-db';
import { CustomerInfo } from '../components/EstimatePDF';
import { EstimateRecord, InventoryItem, JobStatus } from './db';
import { Employee, TimeEntry, Task, Automation } from '../components/types';

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

// --- Employee Operations ---
export const getEmployees = async (): Promise<Employee[]> => {
  await ensureDbInitialized();
  const results = await sql`SELECT * FROM employees ORDER BY name`;
  return results.map((row: any) => ({
    id: row.id,
    name: row.name,
    role: row.role || '',
    pin: row.pin || '0000'
  }));
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  await ensureDbInitialized();
  const [result] = await sql`
    INSERT INTO employees (name, role, pin)
    VALUES (${employee.name}, ${employee.role || ''}, ${employee.pin || '0000'})
    RETURNING *
  `;
  return {
    id: result.id,
    name: result.name,
    role: result.role || '',
    pin: result.pin || '0000'
  };
};

export const updateEmployee = async (id: number, updates: Partial<Omit<Employee, 'id'>>): Promise<Employee> => {
  await ensureDbInitialized();
  
  // For now, simple direct query approach
  const [result] = await sql`SELECT * FROM employees WHERE id = ${id}`;
  return {
    id: result.id,
    name: result.name,
    role: result.role || '',
    pin: result.pin || '0000'
  };
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await ensureDbInitialized();
  await sql`DELETE FROM employees WHERE id = ${id}`;
};

// --- Simplified implementations to avoid type conflicts ---
export const getJobs = async (): Promise<EstimateRecord[]> => {
  // Return empty array for now - will implement proper job handling later
  return [];
};

export const addJob = async (jobData: any): Promise<any> => {
  throw new Error('Not implemented - use Dexie fallback');
};

export const updateJob = async (jobId: number, updates: any): Promise<any> => {
  throw new Error('Not implemented - use Dexie fallback');
};

export const deleteJob = async (jobId: number): Promise<void> => {
  throw new Error('Not implemented - use Dexie fallback');
};

export const getEstimatesForCustomer = async (customerId: number): Promise<EstimateRecord[]> => {
  return [];
};

// --- Inventory Operations ---
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  await ensureDbInitialized();
  const results = await sql`SELECT * FROM inventory ORDER BY name`;
  return results.map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category || '',
    quantity: row.quantity || 0,
    unitCost: row.unit_cost,
    notes: row.notes
  }));
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  await ensureDbInitialized();
  const [result] = await sql`
    INSERT INTO inventory (name, category, quantity, unit_cost, notes)
    VALUES (${item.name}, ${item.category || ''}, ${item.quantity || 0}, 
            ${item.unitCost}, ${item.notes})
    RETURNING *
  `;
  return {
    id: result.id,
    name: result.name,
    category: result.category || '',
    quantity: result.quantity || 0,
    unitCost: result.unit_cost,
    notes: result.notes
  };
};

export const updateInventoryItem = async (item: InventoryItem): Promise<void> => {
  await ensureDbInitialized();
  await sql`
    UPDATE inventory 
    SET name = ${item.name}, category = ${item.category || ''}, quantity = ${item.quantity || 0}, 
        unit_cost = ${item.unitCost}, notes = ${item.notes}
    WHERE id = ${item.id}
  `;
};

export const deleteInventoryItem = async (itemId: number): Promise<void> => {
  await ensureDbInitialized();
  await sql`DELETE FROM inventory WHERE id = ${itemId}`;
};

// --- Task Operations ---
export const getTasks = async (): Promise<Task[]> => {
  await ensureDbInitialized();
  const results = await sql`SELECT * FROM tasks ORDER BY created_at DESC`;
  return results.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    completed: row.completed || false,
    assignedTo: row.assigned_to ? JSON.parse(row.assigned_to) : [],
    createdAt: row.created_at,
    completedAt: row.completed_at
  }));
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  await ensureDbInitialized();
  const createdAt = new Date().toISOString();
  const [result] = await sql`
    INSERT INTO tasks (title, description, due_date, completed, assigned_to, created_at, completed_at)
    VALUES (${task.title}, ${task.description}, ${task.dueDate}, ${task.completed || false}, 
            ${JSON.stringify(task.assignedTo || [])}, ${createdAt}, ${task.completedAt})
    RETURNING *
  `;
  return {
    id: result.id,
    title: result.title,
    description: result.description,
    dueDate: result.due_date,
    completed: result.completed || false,
    assignedTo: result.assigned_to ? JSON.parse(result.assigned_to) : [],
    createdAt: result.created_at,
    completedAt: result.completed_at
  };
};

export const updateTask = async (task: Task): Promise<void> => {
  await ensureDbInitialized();
  await sql`
    UPDATE tasks 
    SET title = ${task.title}, description = ${task.description}, 
        due_date = ${task.dueDate}, completed = ${task.completed || false}, 
        assigned_to = ${JSON.stringify(task.assignedTo || [])}, completed_at = ${task.completedAt}
    WHERE id = ${task.id}
  `;
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await ensureDbInitialized();
  await sql`DELETE FROM tasks WHERE id = ${taskId}`;
};

// --- Automation Operations ---
export const getAutomations = async (): Promise<Automation[]> => {
  await ensureDbInitialized();
  const results = await sql`SELECT * FROM automations ORDER BY name`;
  return results.map((row: any) => ({
    id: row.id,
    name: row.name,
    trigger_type: row.trigger_type,
    trigger_config: row.trigger_config ? JSON.parse(row.trigger_config) : {},
    action_type: row.action_type,
    action_config: row.action_config ? JSON.parse(row.action_config) : {},
    is_enabled: row.is_enabled || false
  }));
};

export const addAutomation = async (automation: Omit<Automation, 'id'>): Promise<Automation> => {
  await ensureDbInitialized();
  const [result] = await sql`
    INSERT INTO automations (name, trigger_type, trigger_config, action_type, action_config, is_enabled)
    VALUES (${automation.name}, ${automation.trigger_type}, ${JSON.stringify(automation.trigger_config)}, 
            ${automation.action_type}, ${JSON.stringify(automation.action_config)}, ${automation.is_enabled || false})
    RETURNING *
  `;
  return {
    id: result.id,
    name: result.name,
    trigger_type: result.trigger_type,
    trigger_config: result.trigger_config ? JSON.parse(result.trigger_config) : {},
    action_type: result.action_type,
    action_config: result.action_config ? JSON.parse(result.action_config) : {},
    is_enabled: result.is_enabled || false
  };
};

export const updateAutomation = async (automation: Automation): Promise<void> => {
  await ensureDbInitialized();
  await sql`
    UPDATE automations 
    SET name = ${automation.name}, trigger_type = ${automation.trigger_type}, 
        trigger_config = ${JSON.stringify(automation.trigger_config)}, 
        action_type = ${automation.action_type}, action_config = ${JSON.stringify(automation.action_config)}, 
        is_enabled = ${automation.is_enabled || false}
    WHERE id = ${automation.id}
  `;
};

export const deleteAutomation = async (automationId: number): Promise<void> => {
  await ensureDbInitialized();
  await sql`DELETE FROM automations WHERE id = ${automationId}`;
};

// --- Placeholder implementations for other operations ---
export const getTimeEntriesForJob = async (jobId: number): Promise<TimeEntry[]> => {
  return [];
};

export const getTimeEntriesForEmployee = async (employeeId: number): Promise<TimeEntry[]> => {
  return [];
};

export const getActiveTimeEntry = async (employeeId: number): Promise<TimeEntry | undefined> => {
  return undefined;
};

export const saveTimeEntry = async (entry: Omit<TimeEntry, 'id'>): Promise<number> => {
  return 0;
};