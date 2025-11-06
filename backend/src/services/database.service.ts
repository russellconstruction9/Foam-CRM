import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;
  private tenantPools: Map<string, Pool> = new Map();

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    this.pool.on('connect', () => {
      logger.info('Database connected successfully');
    });

    this.pool.on('error', (err) => {
      logger.error('Database connection error:', err);
    });
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Query executed', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Query error', { text, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async getTenantClient(organizationId: string): Promise<PoolClient> {
    const schemaName = `org_${organizationId.replace(/-/g, '_')}`;
    
    if (!this.tenantPools.has(organizationId)) {
      const tenantPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: {
          rejectUnauthorized: false
        }
      });
      this.tenantPools.set(organizationId, tenantPool);
    }

    const pool = this.tenantPools.get(organizationId)!;
    const client = await pool.connect();
    
    // Set schema for this connection
    await client.query(`SET search_path TO ${schemaName}, public`);
    
    return client;
  }

  async queryTenant(organizationId: string, text: string, params?: any[]): Promise<QueryResult> {
    const client = await this.getTenantClient(organizationId);
    try {
      const start = Date.now();
      const res = await client.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Tenant query executed', { 
        organizationId, 
        text, 
        duration, 
        rows: res.rowCount 
      });
      return res;
    } catch (error) {
      logger.error('Tenant query error', { organizationId, text, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async createTenantSchema(organizationId: string): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('SELECT create_tenant_schema($1)', [organizationId]);
      logger.info(`Created tenant schema for organization: ${organizationId}`);
    } catch (error) {
      logger.error(`Failed to create tenant schema for organization: ${organizationId}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTenantSchema(organizationId: string): Promise<void> {
    const schemaName = `org_${organizationId.replace(/-/g, '_')}`;
    const client = await this.getClient();
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
      logger.info(`Deleted tenant schema: ${schemaName}`);
    } catch (error) {
      logger.error(`Failed to delete tenant schema: ${schemaName}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    for (const [orgId, pool] of this.tenantPools) {
      await pool.end();
      logger.info(`Closed tenant pool for: ${orgId}`);
    }
  }
}

// Singleton instance
export const dbService = new DatabaseService();