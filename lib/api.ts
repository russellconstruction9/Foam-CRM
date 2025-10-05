
import { db, EstimateRecord as DexieEstimateRecord, InventoryItem as DexieInventoryItem } from './db';
import { supabaseApi, EstimateRecord, InventoryItem } from './supabase-api';
import { CustomerInfo } from '../components/EstimatePDF';
import { Employee, Task, Automation } from '../components/types';

const USE_SUPABASE = true;

export const getCustomers = async (): Promise<CustomerInfo[]> => {
    if (USE_SUPABASE) {
        return await supabaseApi.customers.getAll();
    }
    return await db.customers.toArray();
};

export const addCustomer = async (customer: Omit<CustomerInfo, 'id'>): Promise<CustomerInfo> => {
    if (USE_SUPABASE) {
        return await supabaseApi.customers.create(customer);
    }
    const newId = await db.customers.add(customer as CustomerInfo);
    return { ...customer, id: newId };
};

export const updateCustomer = async (customer: CustomerInfo): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.customers.update(String(customer.id), customer);
        return;
    }
    await db.customers.put(customer);
};

export const getJobs = async (): Promise<EstimateRecord[]> => {
    if (USE_SUPABASE) {
        return await supabaseApi.estimates.getAll();
    }
    return await db.estimates.orderBy('createdAt').reverse().toArray() as any;
};

export const addJob = async (jobData: Omit<EstimateRecord, 'id' | 'createdAt'>): Promise<EstimateRecord> => {
    if (USE_SUPABASE) {
        return await supabaseApi.estimates.create(jobData);
    }
    const recordToSave: any = {
        ...jobData,
        createdAt: new Date().toISOString()
    };
    const id = await db.estimates.add(recordToSave);
    return { ...recordToSave, id: String(id) };
};

export const updateJob = async (jobId: number | string, updates: Partial<Omit<EstimateRecord, 'id'>>): Promise<EstimateRecord> => {
    if (USE_SUPABASE) {
        return await supabaseApi.estimates.update(String(jobId), updates);
    }
    await db.estimates.update(Number(jobId), updates as any);
    const updatedJob = await db.estimates.get(Number(jobId));
    if (!updatedJob) throw new Error("Failed to find job after update.");
    return updatedJob as any;
};

export const deleteJob = async (jobId: number | string): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.estimates.delete(String(jobId));
        return;
    }
    await db.estimates.delete(Number(jobId));
};

export const getEmployees = async (): Promise<Employee[]> => {
    if (USE_SUPABASE) {
        return await supabaseApi.employees.getAll();
    }
    return await db.employees.toArray();
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    if (USE_SUPABASE) {
        return await supabaseApi.employees.create(employee);
    }
    const newId = await db.employees.add(employee as Employee);
    return { ...employee, id: newId };
};

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    if (USE_SUPABASE) {
        return await supabaseApi.inventory.getAll();
    }
    return await db.inventory.toArray();
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    if (USE_SUPABASE) {
        return await supabaseApi.inventory.create(item);
    }
    const newId = await db.inventory.add(item as any);
    return { ...item, id: String(newId) };
};

export const updateInventoryItem = async (item: InventoryItem): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.inventory.update(String(item.id), item);
        return;
    }
    await db.inventory.put(item as any);
};

export const deleteInventoryItem = async (itemId: number | string): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.inventory.delete(String(itemId));
        return;
    }
    await db.inventory.delete(Number(itemId));
};

export const getTasks = async (): Promise<Task[]> => {
    if (USE_SUPABASE) {
        return await supabaseApi.tasks.getAll();
    }
    return await db.tasks.orderBy('createdAt').reverse().toArray();
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>): Promise<Task> => {
    if (USE_SUPABASE) {
        return await supabaseApi.tasks.create(task);
    }
    const newTask: Omit<Task, 'id'> = {
        ...task,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    const newId = await db.tasks.add(newTask as Task);
    return { ...newTask, id: newId };
};

export const updateTask = async (task: Task): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.tasks.update(String(task.id), task);
        return;
    }
    await db.tasks.put(task);
};

export const deleteTask = async (taskId: number | string): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.tasks.delete(String(taskId));
        return;
    }
    await db.tasks.delete(Number(taskId));
};

export const getAutomations = async (): Promise<Automation[]> => {
    if (USE_SUPABASE) {
        return await supabaseApi.automations.getAll();
    }
    return await db.automations.toArray();
};

export const addAutomation = async (automation: Omit<Automation, 'id'>): Promise<Automation> => {
    if (USE_SUPABASE) {
        return await supabaseApi.automations.create(automation);
    }
    const newId = await db.automations.add(automation as Automation);
    return { ...automation, id: newId };
};

export const updateAutomation = async (automation: Automation): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.automations.update(String(automation.id), automation);
        return;
    }
    await db.automations.put(automation);
};

export const deleteAutomation = async (automationId: number | string): Promise<void> => {
    if (USE_SUPABASE) {
        await supabaseApi.automations.delete(String(automationId));
        return;
    }
    await db.automations.delete(Number(automationId));
};
