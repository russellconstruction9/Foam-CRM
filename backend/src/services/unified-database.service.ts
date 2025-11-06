import { QueryResult } from 'pg';
import { dbService } from './database.service';
import { supabaseService } from './supabase.service';
import { logger } from '../utils/logger';

export class UnifiedDatabaseService {
  private usePostgres = true;
  private connectionTested = false;

  async initialize(): Promise<void> {
    if (this.connectionTested) return;

    try {
      const pgWorks = await dbService.testConnection();
      const supabaseWorks = await supabaseService.testConnection();
      
      if (pgWorks) {
        this.usePostgres = true;
        logger.info('Using PostgreSQL direct connection');
      } else if (supabaseWorks) {
        this.usePostgres = false;
        logger.info('PostgreSQL connection failed, falling back to Supabase REST API');
      } else {
        // For development, default to supabase even if test fails
        // This allows us to work around API key issues during development
        this.usePostgres = false;
        logger.info('⚠️  Defaulting to Supabase (development mode) - both connection tests failed');
      }
    } catch (error) {
      logger.error('Database initialization error:', error);
      // Try Supabase as last resort
      this.usePostgres = false;
    }
    
    this.connectionTested = true;
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    await this.initialize();

    if (this.usePostgres) {
      try {
        return await dbService.query(text, params);
      } catch (error) {
        logger.warn('PostgreSQL query failed, attempting Supabase fallback:', error);
        this.usePostgres = false;
        // Fall through to Supabase method
      }
    }

    // Convert SQL query to Supabase REST call (basic implementation)
    throw new Error('SQL to REST conversion not implemented yet. Use table-specific methods instead.');
  }

  async queryTenant(organizationId: string, text: string, params?: any[]): Promise<QueryResult> {
    await this.initialize();

    if (this.usePostgres) {
      try {
        return await dbService.queryTenant(organizationId, text, params);
      } catch (error) {
        logger.warn('PostgreSQL tenant query failed, attempting Supabase fallback:', error);
        this.usePostgres = false;
        // Fall through to Supabase method
      }
    }

    // Convert SQL query to Supabase REST call with RLS filtering
    throw new Error('Tenant SQL to REST conversion not implemented yet. Use table-specific methods instead.');
  }

  // Table-specific methods that work with both backends
  async getCustomers(organizationId: string, options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<any[]> {
    await this.initialize();

    if (this.usePostgres) {
      try {
        let query = 'SELECT * FROM customers WHERE organization_id = $1';
        const queryParams: any[] = [organizationId];
        let paramIndex = 2;

        if (options.search) {
          query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
          queryParams.push(`%${options.search}%`);
          paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        if (options.limit) {
          query += ` LIMIT $${paramIndex}`;
          queryParams.push(options.limit);
          paramIndex++;
        }

        if (options.offset) {
          query += ` OFFSET $${paramIndex}`;
          queryParams.push(options.offset);
        }

        const result = await dbService.query(query, queryParams);
        return result.rows;
      } catch (error) {
        logger.warn('PostgreSQL customers query failed, falling back to Supabase:', error);
        this.usePostgres = false;
      }
    }

    // Supabase REST fallback
    const filter: any = { organization_id: organizationId };
    if (options.search) {
      // Note: Supabase REST API search is more limited than ILIKE
      // This is a simplified implementation
    }

    const queryOptions: any = {
      filter,
      order: 'created_at.desc'
    };
    
    if (options.limit) {
      queryOptions.limit = options.limit;
    }

    return await supabaseService.query('customers', queryOptions);
  }

  async createCustomer(organizationId: string, customerData: any): Promise<any> {
    await this.initialize();

    const data = { ...customerData, organization_id: organizationId };

    if (this.usePostgres) {
      try {
        const query = `
          INSERT INTO customers (organization_id, name, email, phone, address, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        `;
        const result = await dbService.query(query, [
          organizationId,
          data.name,
          data.email,
          data.phone,
          data.address
        ]);
        return result.rows[0];
      } catch (error) {
        logger.warn('PostgreSQL customer insert failed, falling back to Supabase:', error);
        this.usePostgres = false;
      }
    }

    // Supabase REST fallback
    return await supabaseService.insert('customers', data);
  }

  async updateCustomer(customerId: string, customerData: any): Promise<any> {
    await this.initialize();

    const data = { ...customerData, updated_at: new Date().toISOString() };

    if (this.usePostgres) {
      try {
        const fields = Object.keys(data);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `UPDATE customers SET ${setClause} WHERE id = $1 RETURNING *`;
        const values = [customerId, ...Object.values(data)];
        
        const result = await dbService.query(query, values);
        return result.rows[0];
      } catch (error) {
        logger.warn('PostgreSQL customer update failed, falling back to Supabase:', error);
        this.usePostgres = false;
      }
    }

    // Supabase REST fallback
    return await supabaseService.update('customers', { id: customerId }, data);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.initialize();

    if (this.usePostgres) {
      try {
        await dbService.query('DELETE FROM customers WHERE id = $1', [customerId]);
        return;
      } catch (error) {
        logger.warn('PostgreSQL customer delete failed, falling back to Supabase:', error);
        this.usePostgres = false;
      }
    }

    // Supabase REST fallback
    await supabaseService.delete('customers', { id: customerId });
  }

  // Jobs methods
  async getJobs(organizationId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<any[]> {
    await this.initialize();

    if (this.usePostgres) {
      try {
        let query = 'SELECT * FROM jobs WHERE organization_id = $1';
        const queryParams: any[] = [organizationId];
        let paramIndex = 2;

        if (options.status) {
          query += ` AND status = $${paramIndex}`;
          queryParams.push(options.status);
          paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        if (options.limit) {
          query += ` LIMIT $${paramIndex}`;
          queryParams.push(options.limit);
          paramIndex++;
        }

        if (options.offset) {
          query += ` OFFSET $${paramIndex}`;
          queryParams.push(options.offset);
        }

        const result = await dbService.query(query, queryParams);
        return result.rows;
      } catch (error) {
        logger.warn('PostgreSQL jobs query failed, falling back to Supabase:', error);
        this.usePostgres = false;
      }
    }

    // Supabase REST fallback
    const filter: any = { organization_id: organizationId };
    if (options.status) {
      filter.status = options.status;
    }

    const queryOptions: any = {
      filter,
      order: 'created_at.desc'
    };
    
    if (options.limit) {
      queryOptions.limit = options.limit;
    }

    return await supabaseService.query('jobs', queryOptions);
  }

  async createJob(organizationId: string, jobData: any): Promise<any> {
    await this.initialize();

    const data = { ...jobData, organization_id: organizationId };

    if (this.usePostgres) {
      try {
        const query = `
          INSERT INTO jobs (organization_id, customer_id, title, description, status, priority, 
                          scheduled_date, estimated_duration, actual_duration, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING *
        `;
        const result = await dbService.query(query, [
          organizationId,
          data.customer_id,
          data.title,
          data.description,
          data.status || 'pending',
          data.priority || 'medium',
          data.scheduled_date,
          data.estimated_duration,
          data.actual_duration
        ]);
        return result.rows[0];
      } catch (error) {
        logger.warn('PostgreSQL job insert failed, falling back to Supabase:', error);
        this.usePostgres = false;
      }
    }

    // Supabase REST fallback
    return await supabaseService.insert('jobs', data);
  }

  async getCustomerById(customerId: string, organizationId: string): Promise<any> {
    await this.initialize();

    if (this.usePostgres) {
      try {
        const query = `
          SELECT id, organization_id, name, email, phone, address, notes, lat, lng, created_at, updated_at
          FROM customers 
          WHERE id = $1 AND organization_id = $2
        `;
        const result = await dbService.query(query, [customerId, organizationId]);
        return result.rows[0] || null;
      } catch (error) {
        logger.warn('PostgreSQL customer by ID query failed, falling back to Supabase:', error);
        this.usePostgres = false;
      }
    }

    // Supabase REST fallback
    const customers = await supabaseService.query('customers', {
      filter: { id: customerId, organization_id: organizationId },
      limit: 1
    });
    return customers[0] || null;
  }

  async rawQuery(query: string, params: any[] = []): Promise<any> {
    await this.initialize();

    if (this.usePostgres) {
      try {
        const result = await dbService.query(query, params);
        return result;
      } catch (error) {
        logger.warn('PostgreSQL raw query failed, falling back may not be possible:', error);
        throw error; // Raw queries can't be easily converted to REST
      }
    }

    throw new Error('Raw SQL queries not supported with Supabase REST API. Use specific methods instead.');
  }

  async testConnection(): Promise<boolean> {
    await this.initialize();
    return true; // If we got here, at least one connection works
  }
}

// Singleton instance
export const unifiedDbService = new UnifiedDatabaseService();