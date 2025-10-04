import Dexie, { Table } from 'dexie';
import { CustomerInfo, Costs } from '../components/EstimatePDF.tsx';
import { CalculationResults } from '../components/SprayFoamCalculator.tsx';
import { TimeEntry, Employee, Task, DriveFile, Automation } from '../components/types.ts';

export type JobStatus = 'estimate' | 'sold' | 'invoiced' | 'paid';

export interface EstimateRecord {
  id?: number;
  customerId: number;
  estimatePdf: Blob;
  materialOrderPdf: Blob;
  invoicePdf?: Blob;
  estimateNumber: string;
  calcData: Omit<CalculationResults, 'customer'> & { customer?: CustomerInfo };
  costsData: Costs;
  scopeOfWork: string;
  status: JobStatus;
  createdAt: string; // ISO string
}

export interface InventoryItem {
  id?: number;
  name: string;
  category: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export class AppDatabase extends Dexie {
  customers!: Table<CustomerInfo, number>;
  estimates!: Table<EstimateRecord, number>;
  employees!: Table<Employee, number>;
  time_log!: Table<TimeEntry, number>;
  inventory!: Table<InventoryItem, number>;
  tasks!: Table<Task, number>;
  drive_files!: Table<DriveFile, number>;
  automations!: Table<Automation, number>;

  constructor() {
    super('foamCrmDatabase');
    // FIX: Cast `this` to `Dexie` to resolve a TypeScript type error where the `version`
    // method was not found on the subclass. This helps the type checker understand
    // that the `AppDatabase` instance has all methods of a `Dexie` instance.
    (this as Dexie).version(9).stores({
      customers: '++id, name, address',
      estimates: '++id, customerId, estimateNumber, status, createdAt',
      employees: '++id, name',
      time_log: '++id, employeeId, jobId, startTime, endTime, startLat, startLng, endLat, endLng, durationHours',
      inventory: '++id, name, category',
      tasks: '++id, completed, dueDate, createdAt',
      drive_files: '++id, customerId, fileId',
      automations: '++id, name, trigger_type, is_enabled',
    });
  }
}

export const db = new AppDatabase();

// --- DB Helper Functions ---

export async function saveEstimate(estimate: Omit<EstimateRecord, 'id' | 'createdAt'>): Promise<EstimateRecord> {
  const recordToSave: Omit<EstimateRecord, 'id'> = {
    ...estimate,
    createdAt: new Date().toISOString()
  };
  const id = await db.estimates.add(recordToSave as EstimateRecord);
  return { ...recordToSave, id };
}

export async function getEstimatesForCustomer(customerId: number): Promise<EstimateRecord[]> {
  return db.estimates.where('customerId').equals(customerId).toArray();
}

export async function getTimeEntriesForJob(jobId: number): Promise<TimeEntry[]> {
    return db.time_log.where('jobId').equals(jobId).toArray();
}

export async function getActiveTimeEntry(employeeId: number): Promise<TimeEntry | undefined> {
    return db.time_log.where({ employeeId }).filter(entry => !entry.endTime).first();
}

export async function saveTimeEntry(entry: TimeEntry): Promise<number> {
    return db.time_log.put(entry);
}

import { supabase } from './supabase';

export const supabaseHelpers = {
  customers: {
    async getAll() {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(customer: { name: string; address?: string; email?: string; phone?: string; notes?: string; lat?: number; lng?: number }) {
      const { data, error } = await supabase.from('customers').insert(customer).select().single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: Partial<{ name: string; address: string; email: string; phone: string; notes: string; lat: number; lng: number }>) {
      const { data, error } = await supabase.from('customers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    }
  },

  employees: {
    async getAll() {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getByPin(pin: string) {
      const { data, error } = await supabase.from('employees').select('*').eq('pin', pin).maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(employee: { name: string; role?: string; pin: string }) {
      const { data, error } = await supabase.from('employees').insert(employee).select().single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: Partial<{ name: string; role: string; pin: string }>) {
      const { data, error } = await supabase.from('employees').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    }
  },

  estimates: {
    async getAll() {
      const { data, error } = await supabase.from('estimates').select('*, customers(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('estimates').select('*, customers(*)').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getByCustomerId(customerId: string) {
      const { data, error } = await supabase.from('estimates').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async getByStatus(status: 'estimate' | 'sold' | 'invoiced' | 'paid') {
      const { data, error } = await supabase.from('estimates').select('*, customers(*)').eq('status', status).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(estimate: { customer_id: string; estimate_number: string; calc_data: any; costs_data: any; scope_of_work: string; status?: 'estimate' | 'sold' | 'invoiced' | 'paid' }) {
      const { data, error } = await supabase.from('estimates').insert(estimate).select().single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase.from('estimates').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('estimates').delete().eq('id', id);
      if (error) throw error;
    }
  },

  timeLog: {
    async getAll() {
      const { data, error } = await supabase.from('time_log').select('*, employees(*), estimates(*)').order('start_time', { ascending: false });
      if (error) throw error;
      return data;
    },
    async getByEmployeeId(employeeId: string) {
      const { data, error } = await supabase.from('time_log').select('*').eq('employee_id', employeeId).order('start_time', { ascending: false });
      if (error) throw error;
      return data;
    },
    async getByJobId(jobId: string) {
      const { data, error } = await supabase.from('time_log').select('*, employees(*)').eq('job_id', jobId).order('start_time', { ascending: false });
      if (error) throw error;
      return data;
    },
    async getActiveEntry(employeeId: string) {
      const { data, error } = await supabase.from('time_log').select('*').eq('employee_id', employeeId).is('end_time', null).maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(entry: { employee_id: string; job_id: string; start_time: string; start_lat?: number; start_lng?: number }) {
      const { data, error } = await supabase.from('time_log').insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    async clockOut(id: string, endTime: string, endLat?: number, endLng?: number) {
      const entry = await supabase.from('time_log').select('start_time').eq('id', id).single();
      if (entry.error) throw entry.error;

      const durationMs = new Date(endTime).getTime() - new Date(entry.data.start_time).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      const { data, error } = await supabase.from('time_log').update({
        end_time: endTime,
        end_lat: endLat,
        end_lng: endLng,
        duration_hours: durationHours
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  inventory: {
    async getAll() {
      const { data, error } = await supabase.from('inventory').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('inventory').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getByCategory(category: string) {
      const { data, error } = await supabase.from('inventory').select('*').eq('category', category).order('name');
      if (error) throw error;
      return data;
    },
    async create(item: { name: string; category?: string; quantity?: number; unit_cost?: number; notes?: string }) {
      const { data, error } = await supabase.from('inventory').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: Partial<{ name: string; category: string; quantity: number; unit_cost: number; notes: string }>) {
      const { data, error } = await supabase.from('inventory').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
    }
  },

  tasks: {
    async getAll() {
      const { data, error } = await supabase.from('tasks').select('*').order('due_date');
      if (error) throw error;
      return data;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getByCompleted(completed: boolean) {
      const { data, error } = await supabase.from('tasks').select('*').eq('completed', completed).order('due_date');
      if (error) throw error;
      return data;
    },
    async create(task: { title: string; description?: string; due_date?: string; assigned_to?: any[] }) {
      const { data, error } = await supabase.from('tasks').insert(task).select().single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async complete(id: string) {
      const { data, error } = await supabase.from('tasks').update({
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    }
  },

  driveFiles: {
    async getByCustomerId(customerId: string) {
      const { data, error } = await supabase.from('drive_files').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(file: { customer_id: string; file_id: string; file_name: string; web_link: string; icon_link: string }) {
      const { data, error } = await supabase.from('drive_files').insert(file).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('drive_files').delete().eq('id', id);
      if (error) throw error;
    }
  },

  automations: {
    async getAll() {
      const { data, error } = await supabase.from('automations').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async getEnabled() {
      const { data, error } = await supabase.from('automations').select('*').eq('is_enabled', true).order('name');
      if (error) throw error;
      return data;
    },
    async getById(id: string) {
      const { data, error } = await supabase.from('automations').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(automation: { name: string; trigger_type: 'new_customer' | 'job_status_updated'; trigger_config?: any; action_type: string; action_config?: any; is_enabled?: boolean }) {
      const { data, error } = await supabase.from('automations').insert(automation).select().single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase.from('automations').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await supabase.from('automations').delete().eq('id', id);
      if (error) throw error;
    }
  }
};