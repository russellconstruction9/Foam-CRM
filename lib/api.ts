
// API Service for connecting frontend to backend
const API_BASE_URL = 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    // Try to get token from localStorage
    this.token = localStorage.getItem('foam-crm-token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('foam-crm-token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('foam-crm-token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // TODO: Remove this temporary bypass for production
    // For testing, we'll use a hardcoded token or bypass auth
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    } else {
      // Temporary bypass - set a test token
      headers.Authorization = `Bearer test-token-bypass`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(response.status, data.message || 'Request failed', data);
      }

      if (!data.success) {
        throw new ApiError(response.status, data.message || 'API request failed', data);
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(0, 'Network error or server unavailable');
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data: ApiResponse<T> = await response.json();
    
    if (!response.ok || !data.success) {
      throw new ApiError(response.status, data.message || 'GET request failed', data);
    }

    return data.data as T;
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Type definitions for API responses
export interface Customer {
  id: number;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  organization_id: string;
  customer_id: number;
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  estimated_start?: string;
  estimated_end?: string;
  actual_start?: string;
  actual_end?: string;
  estimated_hours?: number;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
}

export interface Employee {
  id: number;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  hourly_rate?: number;
  pin?: string;
  is_active: boolean;
  hire_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  organization_id: string;
  employee_id: number;
  job_id?: number;
  clock_in_time: string;
  clock_out_time?: string;
  duration_hours?: number;
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  employee_name?: string;
  job_name?: string;
}

export interface Estimate {
  id: number;
  organization_id: string;
  customer_id: number;
  job_id?: number;
  estimate_number: string;
  status?: string;
  estimate_pdf_data?: string;
  material_order_pdf_data?: string;
  invoice_pdf_data?: string;
  calc_data?: any;
  costs_data?: any;
  scope_of_work?: string;
  notes?: string;
  valid_until?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  job_name?: string;
  line_items?: LineItem[];
}

export interface LineItem {
  id: number;
  estimate_id: number;
  description: string;
  quantity?: number;
  unit_price: number;
  line_total: number;
  item_order?: number;
  category?: string;
}

export interface InventoryItem {
  id: number;
  organization_id: string;
  name: string;
  description?: string;
  category?: string;
  unit_of_measure?: string;
  current_stock?: number;
  minimum_stock?: number;
  cost_per_unit?: number;
  supplier_info?: any;
  barcode?: string;
  location?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: number;
  organization_id: string;
  inventory_item_id: number;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'return';
  quantity_change: number;
  unit_cost?: number;
  total_cost?: number;
  reference_id?: number;
  reference_type?: string;
  notes?: string;
  employee_id?: number;
  created_at: string;
}

// Task and Automation interfaces (for backwards compatibility)
export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Automation {
  id: number;
  name: string;
  trigger_type: string;
  is_enabled: boolean;
}

// Customer API methods
export const customerApi = {
  async getAll(params?: { limit?: number; offset?: number; search?: string }): Promise<Customer[]> {
    return apiService.get<Customer[]>('/customers', params);
  },

  async getById(id: number): Promise<Customer> {
    return apiService.get<Customer>(`/customers/${id}`);
  },

  async create(customer: Omit<Customer, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    return apiService.post<Customer>('/customers', customer);
  },

  async update(id: number, customer: Partial<Omit<Customer, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<Customer> {
    return apiService.put<Customer>(`/customers/${id}`, customer);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete<void>(`/customers/${id}`);
  },

  async getEstimates(id: number): Promise<Estimate[]> {
    return apiService.get<Estimate[]>(`/customers/${id}/estimates`);
  }
};

// Job API methods
export const jobApi = {
  async getAll(params?: { 
    status?: string; 
    customer_id?: number; 
    limit?: number; 
    offset?: number; 
    search?: string;
  }): Promise<Job[]> {
    return apiService.get<Job[]>('/jobs', params);
  },

  async getById(id: number): Promise<Job> {
    return apiService.get<Job>(`/jobs/${id}`);
  },

  async create(job: Omit<Job, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Job> {
    return apiService.post<Job>('/jobs', job);
  },

  async update(id: number, job: Partial<Omit<Job, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<Job> {
    return apiService.put<Job>(`/jobs/${id}`, job);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete<void>(`/jobs/${id}`);
  },

  async getTimeEntries(id: number): Promise<TimeEntry[]> {
    return apiService.get<TimeEntry[]>(`/jobs/${id}/time-entries`);
  }
};

// Employee API methods
export const employeeApi = {
  async getAll(params?: { 
    is_active?: boolean; 
    limit?: number; 
    offset?: number; 
    search?: string;
  }): Promise<Employee[]> {
    return apiService.get<Employee[]>('/employees', params);
  },

  async getById(id: number): Promise<Employee> {
    return apiService.get<Employee>(`/employees/${id}`);
  },

  async create(employee: Omit<Employee, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    return apiService.post<Employee>('/employees', employee);
  },

  async update(id: number, employee: Partial<Omit<Employee, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<Employee> {
    return apiService.put<Employee>(`/employees/${id}`, employee);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete<void>(`/employees/${id}`);
  },

  async clockIn(employeeId: number, data: { 
    pin: string; 
    job_id?: number; 
    latitude?: number; 
    longitude?: number; 
    notes?: string; 
  }): Promise<TimeEntry> {
    return apiService.post<TimeEntry>(`/employees/${employeeId}/clock-in`, data);
  },

  async clockOut(employeeId: number, data: { 
    pin: string; 
    latitude?: number; 
    longitude?: number; 
    notes?: string; 
  }): Promise<TimeEntry> {
    return apiService.post<TimeEntry>(`/employees/${employeeId}/clock-out`, data);
  },

  async getTimeEntries(id: number, params?: { limit?: number; offset?: number }): Promise<TimeEntry[]> {
    return apiService.get<TimeEntry[]>(`/employees/${id}/time-entries`, params);
  }
};

// Estimate API methods
export const estimateApi = {
  async getAll(params?: { 
    status?: string; 
    customer_id?: number; 
    limit?: number; 
    offset?: number; 
  }): Promise<Estimate[]> {
    return apiService.get<Estimate[]>('/estimates', params);
  },

  async getById(id: number): Promise<Estimate> {
    return apiService.get<Estimate>(`/estimates/${id}`);
  },

  async create(estimate: Omit<Estimate, 'id' | 'organization_id' | 'created_at' | 'updated_at'> & { 
    line_items?: Omit<LineItem, 'id' | 'estimate_id'>[] 
  }): Promise<Estimate> {
    return apiService.post<Estimate>('/estimates', estimate);
  },

  async update(id: number, estimate: Partial<Omit<Estimate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<Estimate> {
    return apiService.put<Estimate>(`/estimates/${id}`, estimate);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete<void>(`/estimates/${id}`);
  },

  async addLineItem(id: number, lineItem: Omit<LineItem, 'id' | 'estimate_id'>): Promise<LineItem> {
    return apiService.post<LineItem>(`/estimates/${id}/line-items`, lineItem);
  },

  async updateLineItem(id: number, lineItemId: number, lineItem: Partial<Omit<LineItem, 'id' | 'estimate_id'>>): Promise<LineItem> {
    return apiService.put<LineItem>(`/estimates/${id}/line-items/${lineItemId}`, lineItem);
  },

  async deleteLineItem(id: number, lineItemId: number): Promise<void> {
    return apiService.delete<void>(`/estimates/${id}/line-items/${lineItemId}`);
  }
};

// Inventory API methods
export const inventoryApi = {
  async getAll(params?: { 
    category?: string; 
    is_active?: boolean; 
    limit?: number; 
    offset?: number; 
    search?: string; 
  }): Promise<InventoryItem[]> {
    return apiService.get<InventoryItem[]>('/inventory', params);
  },

  async getById(id: number): Promise<InventoryItem & { recent_transactions?: StockTransaction[] }> {
    return apiService.get<InventoryItem & { recent_transactions?: StockTransaction[] }>(`/inventory/${id}`);
  },

  async create(item: Omit<InventoryItem, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    return apiService.post<InventoryItem>('/inventory', item);
  },

  async update(id: number, item: Partial<Omit<InventoryItem, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<InventoryItem> {
    return apiService.put<InventoryItem>(`/inventory/${id}`, item);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete<void>(`/inventory/${id}`);
  },

  async recordStockTransaction(id: number, transaction: Omit<StockTransaction, 'id' | 'organization_id' | 'inventory_item_id' | 'employee_id' | 'created_at'>): Promise<{ transaction: StockTransaction; new_stock_level: number }> {
    return apiService.post<{ transaction: StockTransaction; new_stock_level: number }>(`/inventory/${id}/stock-transaction`, transaction);
  },

  async getLowStock(): Promise<InventoryItem[]> {
    return apiService.get<InventoryItem[]>('/inventory/low-stock');
  },

  async getCategories(): Promise<string[]> {
    return apiService.get<string[]>('/inventory/categories');
  }
};

// Auth API methods (for when we implement authentication)
export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: any; organization: any }> {
    const result = await apiService.post<{ token: string; user: any; organization: any }>('/auth/login', {
      email,
      password
    });
    
    if (result.token) {
      apiService.setToken(result.token);
    }
    
    return result;
  },

  async register(data: {
    name: string;
    email: string; 
    password: string;
    organizationName: string;
  }): Promise<{ token: string; user: any; organization: any }> {
    const result = await apiService.post<{ token: string; user: any; organization: any }>('/auth/register', data);
    
    if (result.token) {
      apiService.setToken(result.token);
    }
    
    return result;
  },

  async logout(): Promise<void> {
    apiService.clearToken();
  },

  async refreshToken(): Promise<{ token: string }> {
    const result = await apiService.post<{ token: string }>('/auth/refresh');
    
    if (result.token) {
      apiService.setToken(result.token);
    }
    
    return result;
  }
};

// Legacy compatibility functions (for existing components)
export const getCustomers = async () => {
  return customerApi.getAll();
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
  return customerApi.create(customer);
};

export const updateCustomer = async (customer: Customer) => {
  return customerApi.update(customer.id, customer);
};

export const getJobs = async () => {
  return estimateApi.getAll();
};

export const addJob = async (jobData: any) => {
  return estimateApi.create(jobData);
};

export const updateJob = async (jobId: number, updates: any) => {
  return estimateApi.update(jobId, updates);
};

export const deleteJob = async (jobId: number) => {
  return estimateApi.delete(jobId);
};

export const getEmployees = async () => {
  return employeeApi.getAll();
};

export const addEmployee = async (employee: Omit<Employee, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
  return employeeApi.create(employee);
};

export const getInventoryItems = async () => {
  return inventoryApi.getAll();
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
  return inventoryApi.create(item);
};

export const updateInventoryItem = async (item: InventoryItem) => {
  return inventoryApi.update(item.id, item);
};

export const deleteInventoryItem = async (itemId: number) => {
  return inventoryApi.delete(itemId);
};

// Placeholder functions for tasks and automations (using localStorage for now)
export const getTasks = async (): Promise<Task[]> => {
  const tasks = localStorage.getItem('foam-crm-tasks');
  return tasks ? JSON.parse(tasks) : [];
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'completed'>): Promise<Task> => {
  const tasks = await getTasks();
  const newTask: Task = {
    ...task,
    id: Date.now(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  localStorage.setItem('foam-crm-tasks', JSON.stringify(tasks));
  return newTask;
};

export const updateTask = async (task: Task): Promise<void> => {
  const tasks = await getTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  if (index !== -1) {
    tasks[index] = task;
    localStorage.setItem('foam-crm-tasks', JSON.stringify(tasks));
  }
};

export const deleteTask = async (taskId: number): Promise<void> => {
  const tasks = await getTasks();
  const filteredTasks = tasks.filter(t => t.id !== taskId);
  localStorage.setItem('foam-crm-tasks', JSON.stringify(filteredTasks));
};

export const getAutomations = async (): Promise<Automation[]> => {
  const automations = localStorage.getItem('foam-crm-automations');
  return automations ? JSON.parse(automations) : [];
};

export const addAutomation = async (automation: Omit<Automation, 'id'>): Promise<Automation> => {
  const automations = await getAutomations();
  const newAutomation: Automation = {
    ...automation,
    id: Date.now(),
  };
  automations.push(newAutomation);
  localStorage.setItem('foam-crm-automations', JSON.stringify(automations));
  return newAutomation;
};

export const updateAutomation = async (automation: Automation): Promise<void> => {
  const automations = await getAutomations();
  const index = automations.findIndex(a => a.id === automation.id);
  if (index !== -1) {
    automations[index] = automation;
    localStorage.setItem('foam-crm-automations', JSON.stringify(automations));
  }
};

export const deleteAutomation = async (automationId: number): Promise<void> => {
  const automations = await getAutomations();
  const filteredAutomations = automations.filter(a => a.id !== automationId);
  localStorage.setItem('foam-crm-automations', JSON.stringify(filteredAutomations));
};

export { ApiError };
