import { Request } from 'express';

// Base interfaces matching frontend types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due';
  trial_ends_at?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  permissions: string[];
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
}

// Customer interface (matching frontend)
export interface Customer {
  id?: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Job/Estimate interface (matching frontend)
export interface Job {
  id?: number;
  customer_id: number;
  estimate_number: string;
  estimate_pdf_url?: string;
  material_order_pdf_url?: string;
  invoice_pdf_url?: string;
  calc_data: Record<string, any>;
  costs_data: Record<string, any>;
  scope_of_work?: string;
  status: 'estimate' | 'sold' | 'invoiced' | 'paid';
  created_at?: string;
  updated_at?: string;
}

// Employee interface (matching frontend)
export interface Employee {
  id?: number;
  name: string;
  role: string;
  pin: string;
  created_at?: string;
  updated_at?: string;
}

// Task interface (matching frontend)
export interface Task {
  id?: number;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  assigned_to: number[];
  created_at?: string;
  completed_at?: string;
}

// Inventory interface (matching frontend)
export interface InventoryItem {
  id?: number;
  name: string;
  category: string;
  quantity: number;
  unit_cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Automation interface (matching frontend)
export interface Automation {
  id?: number;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_enabled: boolean;
  created_at?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

// Extended Request with authentication
export interface AuthenticatedRequest extends Request {
  user: User;
  organization: Organization;
  permissions: string[];
  member: OrganizationMember;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Database query result
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}