import { neon } from '@neondatabase/serverless';

// Get the database URL from environment variables
const getDatabaseUrl = (): string => {
  // Try Vite environment variables first (for browser), then Node.js (for server)
  const url = import.meta.env.VITE_DATABASE_URL || 
              import.meta.env.DATABASE_URL ||
              'postgresql://neondb_owner:npg_bm2JQV4zFqha@ep-lingering-hall-aeapbk2l-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
  
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
};

// Create the SQL function
export const sql = neon(getDatabaseUrl());

// Helper function to execute the database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test the connection
    await sql`SELECT 1`;
    console.log('Database connection established');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Type-safe query helper functions using template literals
export const db = {
  // Execute any SQL query
  query: async <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> => {
    try {
      const result = await sql(strings, ...values);
      return result as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Get a single record
  findOne: async <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T | null> => {
    try {
      const result = await sql(strings, ...values);
      return result.length > 0 ? (result[0] as T) : null;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Get multiple records  
  findMany: async <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> => {
    try {
      const result = await sql(strings, ...values);
      return result as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Insert and return the created record
  insert: async <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T> => {
    try {
      const result = await sql(strings, ...values);
      return result[0] as T;
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  },

  // Update records
  update: async (strings: TemplateStringsArray, ...values: any[]): Promise<any[]> => {
    try {
      const result = await sql(strings, ...values);
      return result;
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  },

  // Delete records
  delete: async (strings: TemplateStringsArray, ...values: any[]): Promise<any[]> => {
    try {
      const result = await sql(strings, ...values);
      return result;
    } catch (error) {
      console.error('Database delete error:', error);
      throw error;
    }
  }
};

// Database types matching the PostgreSQL schema
export interface DbCustomer {
  id: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  created_at: Date;
}

export interface DbEstimate {
  id: number;
  customer_id: number;
  estimate_pdf?: Buffer;
  material_order_pdf?: Buffer;
  invoice_pdf?: Buffer;
  estimate_number: string;
  calc_data?: any;
  costs_data?: any;
  scope_of_work?: string;
  status: 'estimate' | 'sold' | 'invoiced' | 'paid';
  created_at: Date;
}

export interface DbEmployee {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  hourly_rate?: number;
  is_admin: boolean;
  created_at: Date;
}

export interface DbTimeEntry {
  id: number;
  employee_id: number;
  job_id?: number;
  start_time?: Date;
  end_time?: Date;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  duration_hours?: number;
  notes?: string;
  created_at: Date;
}

export interface DbInventoryItem {
  id: number;
  name: string;
  category?: string;
  quantity: number;
  unit_cost?: number;
  notes?: string;
  created_at: Date;
}

export interface DbTask {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: Date;
  assignee_id?: number;
  job_id?: number;
  created_at: Date;
}

export interface DbDriveFile {
  id: number;
  customer_id: number;
  file_id: string;
  file_name?: string;
  file_type?: string;
  created_at: Date;
}

export interface DbAutomation {
  id: number;
  name: string;
  trigger_type?: string;
  conditions?: any;
  actions?: any;
  is_enabled: boolean;
  created_at: Date;
}