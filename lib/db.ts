
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
// All database helper/CRUD functions have been moved to lib/api.ts 
// to create a centralized service layer. This makes it easier to swap
// out the local database with a real backend API in the future.
