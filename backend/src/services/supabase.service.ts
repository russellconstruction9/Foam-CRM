// Alternative database service using Supabase REST API
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
// Prefer a server-side service role key when available for full privileges.
// Fallback to anon key if service role key is not provided.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

interface SupabaseResponse<T> {
  data?: T[];
  error?: any;
}

export class SupabaseService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Missing Supabase configuration (SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY)');
    }
    this.baseUrl = `${SUPABASE_URL}/rest/v1`;
    this.apiKey = SUPABASE_KEY;
  }

  private getHeaders(): Record<string, string> {
    return {
      // For server-side requests prefer the service role key. Both 'apikey' and
      // 'Authorization' are set to allow Supabase REST to validate the request.
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async query(table: string, options: {
    select?: string;
    filter?: Record<string, any>;
    limit?: number;
    order?: string;
  } = {}): Promise<any[]> {
    let url = `${this.baseUrl}/${table}`;
    const params = new URLSearchParams();

    if (options.select) {
      params.append('select', options.select);
    }

    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });
    }

    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    if (options.order) {
      params.append('order', options.order);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase query failed: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<any[]>;
  }

  async insert(table: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${table}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase insert failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  async update(table: string, filter: Record<string, any>, data: any): Promise<any> {
    let url = `${this.baseUrl}/${table}`;
    const params = new URLSearchParams();

    Object.entries(filter).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase update failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  async delete(table: string, filter: Record<string, any>): Promise<void> {
    let url = `${this.baseUrl}/${table}`;
    const params = new URLSearchParams();

    Object.entries(filter).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase delete failed: ${response.status} ${errorText}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.query('organizations', { limit: 1 });
      return true;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();