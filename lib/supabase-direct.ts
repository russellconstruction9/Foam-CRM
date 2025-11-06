// Direct Supabase REST API service for frontend testing
// This bypasses our backend temporarily to test the database connection

const SUPABASE_URL = 'https://culevoomfgllinivgdem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bGV2b29tZmdsbGluaXZnZGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjgzNTksImV4cCI6MjA3Nzk0NDM1OX0.VrjEoYnqxPiWU6KxWR4b7sSfujAeVYDqIwbTXPXmQ_w';

class DirectSupabaseService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/rest/v1`;
    this.apiKey = SUPABASE_ANON_KEY;
  }

  private getHeaders(): Record<string, string> {
    return {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations?limit=1`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  // Customer methods
  async getCustomers(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/customers?order=created_at.desc`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }

    return response.json();
  }

  async createCustomer(customer: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...customer,
        organization_id: 'test-org-123' // Use test org ID for now
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create customer: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  async updateCustomer(id: number, customer: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/customers?id=eq.${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(customer),
    });

    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  async deleteCustomer(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/customers?id=eq.${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete customer: ${response.status}`);
    }
  }

  // Inventory methods
  async getInventoryItems(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/inventory_items?order=name.asc`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.status}`);
    }

    return response.json();
  }

  async createInventoryItem(item: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/inventory_items`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...item,
        organization_id: 'test-org-123'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create inventory item: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  // Employee methods
  async getEmployees(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/employees?order=name.asc`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.status}`);
    }

    return response.json();
  }

  async createEmployee(employee: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/employees`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...employee,
        organization_id: 'test-org-123'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create employee: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  // Job/Estimate methods
  async getEstimates(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/estimates?order=created_at.desc`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch estimates: ${response.status}`);
    }

    return response.json();
  }

  async createEstimate(estimate: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/estimates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...estimate,
        organization_id: 'test-org-123'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create estimate: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }
}

export const directSupabaseService = new DirectSupabaseService();