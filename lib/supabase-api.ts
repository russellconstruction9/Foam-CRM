import { supabaseHelpers, EstimateRecord, InventoryItem } from './db';
import { CustomerInfo, Costs } from '../components/EstimatePDF';
import { CalculationResults } from '../components/SprayFoamCalculator';
import { Employee, Task, Automation, TimeEntry, DriveFile } from '../components/types';
import { Database } from './database.types';

type DbCustomer = Database['public']['Tables']['customers']['Row'];
type DbEmployee = Database['public']['Tables']['employees']['Row'];
type DbEstimate = Database['public']['Tables']['estimates']['Row'];
type DbTimeLog = Database['public']['Tables']['time_log']['Row'];
type DbInventory = Database['public']['Tables']['inventory']['Row'];
type DbTask = Database['public']['Tables']['tasks']['Row'];
type DbDriveFile = Database['public']['Tables']['drive_files']['Row'];
type DbAutomation = Database['public']['Tables']['automations']['Row'];

function dbCustomerToCustomerInfo(dbCustomer: any): CustomerInfo {
  return {
    id: dbCustomer.numeric_id,
    name: dbCustomer.name,
    address: dbCustomer.address,
    email: dbCustomer.email,
    phone: dbCustomer.phone,
    notes: dbCustomer.notes || undefined,
    lat: dbCustomer.lat || undefined,
    lng: dbCustomer.lng || undefined,
  };
}

function customerInfoToDbCustomer(customer: Partial<CustomerInfo>): any {
  return {
    name: customer.name,
    address: customer.address || '',
    email: customer.email || '',
    phone: customer.phone || '',
    notes: customer.notes || null,
    lat: customer.lat || null,
    lng: customer.lng || null,
  };
}

function dbEmployeeToEmployee(dbEmployee: any): Employee {
  return {
    id: dbEmployee.numeric_id,
    name: dbEmployee.name,
    role: dbEmployee.role,
    pin: dbEmployee.pin,
  };
}

function employeeToDbEmployee(employee: Partial<Employee>): any {
  return {
    name: employee.name,
    role: employee.role || 'crew',
    pin: employee.pin,
  };
}

function dbEstimateToEstimateRecord(dbEstimate: any): EstimateRecord {
  return {
    id: dbEstimate.numeric_id,
    customerId: dbEstimate.customers?.numeric_id || parseInt(dbEstimate.customer_id),
    estimateNumber: dbEstimate.estimate_number,
    estimatePdf: dbEstimate.estimate_pdf,
    materialOrderPdf: dbEstimate.material_order_pdf,
    invoicePdf: dbEstimate.invoice_pdf,
    calcData: dbEstimate.calc_data,
    costsData: dbEstimate.costs_data,
    scopeOfWork: dbEstimate.scope_of_work,
    status: dbEstimate.status,
    createdAt: dbEstimate.created_at,
  };
}

function dbInventoryToInventoryItem(dbInventory: any): InventoryItem {
  return {
    id: dbInventory.numeric_id,
    name: dbInventory.name,
    category: dbInventory.category,
    quantity: dbInventory.quantity,
    unitCost: dbInventory.unit_cost || undefined,
    notes: dbInventory.notes || undefined,
  };
}

function dbTaskToTask(dbTask: any): Task {
  return {
    id: dbTask.numeric_id,
    title: dbTask.title,
    description: dbTask.description || undefined,
    dueDate: dbTask.due_date || undefined,
    completed: dbTask.completed,
    assignedTo: (dbTask.assigned_to as any) || [],
    createdAt: dbTask.created_at,
    completedAt: dbTask.completed_at || undefined,
  };
}

function dbAutomationToAutomation(dbAutomation: any): Automation {
  return {
    id: dbAutomation.numeric_id,
    name: dbAutomation.name,
    trigger_type: dbAutomation.trigger_type,
    trigger_config: (dbAutomation.trigger_config as any) || {},
    action_type: dbAutomation.action_type,
    action_config: (dbAutomation.action_config as any) || {},
    is_enabled: dbAutomation.is_enabled,
  };
}

export const supabaseApi = {
  customers: {
    async getAll(): Promise<CustomerInfo[]> {
      const customers = await supabaseHelpers.customers.getAll();
      return customers.map(dbCustomerToCustomerInfo);
    },

    async getById(id: string): Promise<CustomerInfo | null> {
      const customer = await supabaseHelpers.customers.getById(id);
      return customer ? dbCustomerToCustomerInfo(customer) : null;
    },

    async create(customer: Omit<CustomerInfo, 'id'>): Promise<CustomerInfo> {
      const dbCustomer = await supabaseHelpers.customers.create(customerInfoToDbCustomer(customer));
      return dbCustomerToCustomerInfo(dbCustomer);
    },

    async update(id: string, updates: Partial<CustomerInfo>): Promise<CustomerInfo> {
      const dbCustomer = await supabaseHelpers.customers.update(id, customerInfoToDbCustomer(updates));
      return dbCustomerToCustomerInfo(dbCustomer);
    },

    async delete(id: string): Promise<void> {
      await supabaseHelpers.customers.delete(id);
    },
  },

  employees: {
    async getAll(): Promise<Employee[]> {
      const employees = await supabaseHelpers.employees.getAll();
      return employees.map(dbEmployeeToEmployee);
    },

    async getById(id: string): Promise<Employee | null> {
      const employee = await supabaseHelpers.employees.getById(id);
      return employee ? dbEmployeeToEmployee(employee) : null;
    },

    async getByPin(pin: string): Promise<Employee | null> {
      const employee = await supabaseHelpers.employees.getByPin(pin);
      return employee ? dbEmployeeToEmployee(employee) : null;
    },

    async create(employee: Omit<Employee, 'id'>): Promise<Employee> {
      const dbEmployee = await supabaseHelpers.employees.create(employeeToDbEmployee(employee));
      return dbEmployeeToEmployee(dbEmployee);
    },

    async update(id: string, updates: Partial<Employee>): Promise<Employee> {
      const dbEmployee = await supabaseHelpers.employees.update(id, employeeToDbEmployee(updates));
      return dbEmployeeToEmployee(dbEmployee);
    },

    async delete(id: string): Promise<void> {
      await supabaseHelpers.employees.delete(id);
    },
  },

  estimates: {
    async getAll(): Promise<EstimateRecord[]> {
      const estimates = await supabaseHelpers.estimates.getAll();
      return estimates.map(dbEstimateToEstimateRecord);
    },

    async getById(id: string): Promise<EstimateRecord | null> {
      const estimate = await supabaseHelpers.estimates.getById(id);
      return estimate ? dbEstimateToEstimateRecord(estimate) : null;
    },

    async getByCustomerId(customerId: string | number): Promise<EstimateRecord[]> {
      const customer = await supabaseHelpers.customers.getById(String(customerId));
      if (!customer) {
        return [];
      }
      const estimates = await supabaseHelpers.estimates.getByCustomerId(customer.id);
      return estimates.map(dbEstimateToEstimateRecord);
    },

    async getByStatus(status: 'estimate' | 'sold' | 'invoiced' | 'paid'): Promise<EstimateRecord[]> {
      const estimates = await supabaseHelpers.estimates.getByStatus(status);
      return estimates.map(dbEstimateToEstimateRecord);
    },

    async create(estimate: Omit<EstimateRecord, 'id' | 'createdAt'>): Promise<EstimateRecord> {
      const customer = await supabaseHelpers.customers.getById(String(estimate.customerId));
      if (!customer) {
        throw new Error(`Customer with numeric_id ${estimate.customerId} not found`);
      }

      const dbEstimate = await supabaseHelpers.estimates.create({
        customer_id: customer.id,
        estimate_number: estimate.estimateNumber,
        calc_data: estimate.calcData,
        costs_data: estimate.costsData,
        scope_of_work: estimate.scopeOfWork,
        status: estimate.status || 'estimate',
      });
      return dbEstimateToEstimateRecord(dbEstimate);
    },

    async update(id: string, updates: Partial<EstimateRecord>): Promise<EstimateRecord> {
      const updateData: any = {};

      if (updates.customerId) {
        const customer = await supabaseHelpers.customers.getById(String(updates.customerId));
        if (!customer) {
          throw new Error(`Customer with numeric_id ${updates.customerId} not found`);
        }
        updateData.customer_id = customer.id;
      }

      if (updates.estimateNumber) updateData.estimate_number = updates.estimateNumber;
      if (updates.calcData) updateData.calc_data = updates.calcData;
      if (updates.costsData) updateData.costs_data = updates.costsData;
      if (updates.scopeOfWork) updateData.scope_of_work = updates.scopeOfWork;
      if (updates.status) updateData.status = updates.status;

      const dbEstimate = await supabaseHelpers.estimates.update(id, updateData);
      return dbEstimateToEstimateRecord(dbEstimate);
    },

    async delete(id: string): Promise<void> {
      await supabaseHelpers.estimates.delete(id);
    },
  },

  timeLog: {
    async getAll() {
      return await supabaseHelpers.timeLog.getAll();
    },

    async getByEmployeeId(employeeId: string) {
      return await supabaseHelpers.timeLog.getByEmployeeId(employeeId);
    },

    async getByJobId(jobId: string) {
      return await supabaseHelpers.timeLog.getByJobId(jobId);
    },

    async getActiveEntry(employeeId: string) {
      return await supabaseHelpers.timeLog.getActiveEntry(employeeId);
    },

    async clockIn(employeeId: string, jobId: string, lat?: number, lng?: number) {
      return await supabaseHelpers.timeLog.create({
        employee_id: employeeId,
        job_id: jobId,
        start_time: new Date().toISOString(),
        start_lat: lat,
        start_lng: lng,
      });
    },

    async clockOut(id: string, lat?: number, lng?: number) {
      return await supabaseHelpers.timeLog.clockOut(id, new Date().toISOString(), lat, lng);
    },
  },

  inventory: {
    async getAll(): Promise<InventoryItem[]> {
      const items = await supabaseHelpers.inventory.getAll();
      return items.map(dbInventoryToInventoryItem);
    },

    async getById(id: string): Promise<InventoryItem | null> {
      const item = await supabaseHelpers.inventory.getById(id);
      return item ? dbInventoryToInventoryItem(item) : null;
    },

    async getByCategory(category: string): Promise<InventoryItem[]> {
      const items = await supabaseHelpers.inventory.getByCategory(category);
      return items.map(dbInventoryToInventoryItem);
    },

    async create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
      const dbItem = await supabaseHelpers.inventory.create({
        name: item.name,
        category: item.category || '',
        quantity: item.quantity || 0,
        unit_cost: item.unitCost,
        notes: item.notes,
      });
      return dbInventoryToInventoryItem(dbItem);
    },

    async update(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.category) updateData.category = updates.category;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unitCost !== undefined) updateData.unit_cost = updates.unitCost;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const dbItem = await supabaseHelpers.inventory.update(id, updateData);
      return dbInventoryToInventoryItem(dbItem);
    },

    async delete(id: string): Promise<void> {
      await supabaseHelpers.inventory.delete(id);
    },
  },

  tasks: {
    async getAll(): Promise<Task[]> {
      const tasks = await supabaseHelpers.tasks.getAll();
      return tasks.map(dbTaskToTask);
    },

    async getById(id: string): Promise<Task | null> {
      const task = await supabaseHelpers.tasks.getById(id);
      return task ? dbTaskToTask(task) : null;
    },

    async getByCompleted(completed: boolean): Promise<Task[]> {
      const tasks = await supabaseHelpers.tasks.getByCompleted(completed);
      return tasks.map(dbTaskToTask);
    },

    async create(task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>): Promise<Task> {
      const dbTask = await supabaseHelpers.tasks.create({
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        assigned_to: task.assignedTo || [],
      });
      return dbTaskToTask(dbTask);
    },

    async update(id: string, updates: Partial<Task>): Promise<Task> {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

      const dbTask = await supabaseHelpers.tasks.update(id, updateData);
      return dbTaskToTask(dbTask);
    },

    async complete(id: string): Promise<Task> {
      const dbTask = await supabaseHelpers.tasks.complete(id);
      return dbTaskToTask(dbTask);
    },

    async delete(id: string): Promise<void> {
      await supabaseHelpers.tasks.delete(id);
    },
  },

  driveFiles: {
    async getByCustomerId(customerId: string) {
      return await supabaseHelpers.driveFiles.getByCustomerId(customerId);
    },

    async create(file: { customer_id: string; file_id: string; file_name: string; web_link: string; icon_link: string }) {
      return await supabaseHelpers.driveFiles.create(file);
    },

    async delete(id: string) {
      await supabaseHelpers.driveFiles.delete(id);
    },
  },

  automations: {
    async getAll(): Promise<Automation[]> {
      const automations = await supabaseHelpers.automations.getAll();
      return automations.map(dbAutomationToAutomation);
    },

    async getEnabled(): Promise<Automation[]> {
      const automations = await supabaseHelpers.automations.getEnabled();
      return automations.map(dbAutomationToAutomation);
    },

    async getById(id: string): Promise<Automation | null> {
      const automation = await supabaseHelpers.automations.getById(id);
      return automation ? dbAutomationToAutomation(automation) : null;
    },

    async create(automation: Omit<Automation, 'id'>): Promise<Automation> {
      const dbAutomation = await supabaseHelpers.automations.create({
        name: automation.name,
        trigger_type: automation.trigger_type,
        trigger_config: automation.trigger_config || {},
        action_type: automation.action_type,
        action_config: automation.action_config || {},
        is_enabled: automation.is_enabled !== undefined ? automation.is_enabled : true,
      });
      return dbAutomationToAutomation(dbAutomation);
    },

    async update(id: string, updates: Partial<Automation>): Promise<Automation> {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.trigger_type) updateData.trigger_type = updates.trigger_type;
      if (updates.trigger_config) updateData.trigger_config = updates.trigger_config;
      if (updates.action_type) updateData.action_type = updates.action_type;
      if (updates.action_config) updateData.action_config = updates.action_config;
      if (updates.is_enabled !== undefined) updateData.is_enabled = updates.is_enabled;

      const dbAutomation = await supabaseHelpers.automations.update(id, updateData);
      return dbAutomationToAutomation(dbAutomation);
    },

    async delete(id: string): Promise<void> {
      await supabaseHelpers.automations.delete(id);
    },
  },
};
