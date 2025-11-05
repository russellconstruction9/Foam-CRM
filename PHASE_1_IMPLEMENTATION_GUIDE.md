# Phase 1 Implementation Guide - SaaS Transformation

## Overview
This guide provides detailed technical instructions for implementing Phase 1 of the Foam CRM SaaS transformation. Phase 1 focuses on building the foundational backend infrastructure and modifying the frontend to work with a cloud-based API.

## Backend Setup

### 1. Project Structure
```
foam-crm-backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── customers.controller.ts
│   │   ├── jobs.controller.ts
│   │   └── organizations.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── tenant.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Organization.model.ts
│   │   └── Customer.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── customers.routes.ts
│   │   └── jobs.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── database.service.ts
│   │   └── email.service.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── migrations/
├── seeds/
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

### 2. Database Schema Migration

#### Create Migration Files
```sql
-- migrations/001_create_base_tables.sql
-- Global tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'employee')),
    permissions JSONB DEFAULT '[]',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id)
);

-- Function to create tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(org_id UUID)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT := 'org_' || replace(org_id::text, '-', '_');
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Create customers table
    EXECUTE format('
        CREATE TABLE %I.customers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            email VARCHAR(255),
            phone VARCHAR(50),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name);
    
    -- Create estimates table
    EXECUTE format('
        CREATE TABLE %I.estimates (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES %I.customers(id),
            estimate_number VARCHAR(100) NOT NULL,
            estimate_pdf_url VARCHAR(500),
            material_order_pdf_url VARCHAR(500),
            invoice_pdf_url VARCHAR(500),
            calc_data JSONB NOT NULL,
            costs_data JSONB NOT NULL,
            scope_of_work TEXT,
            status VARCHAR(50) DEFAULT ''estimate'' CHECK (status IN (''estimate'', ''sold'', ''invoiced'', ''paid'')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name, schema_name);
    
    -- Create employees table
    EXECUTE format('
        CREATE TABLE %I.employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(100) NOT NULL,
            pin VARCHAR(4) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name);
    
    -- Create inventory table
    EXECUTE format('
        CREATE TABLE %I.inventory (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            quantity DECIMAL(10,2) DEFAULT 0,
            unit_cost DECIMAL(10,2),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name);
    
    -- Create tasks table
    EXECUTE format('
        CREATE TABLE %I.tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date DATE,
            completed BOOLEAN DEFAULT FALSE,
            assigned_to INTEGER[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        )', schema_name);
    
    -- Create automations table
    EXECUTE format('
        CREATE TABLE %I.automations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            trigger_type VARCHAR(100) NOT NULL,
            trigger_config JSONB DEFAULT ''{}''::jsonb,
            action_type VARCHAR(100) NOT NULL,
            action_config JSONB DEFAULT ''{}''::jsonb,
            is_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name);
    
END;
$$ LANGUAGE plpgsql;
```

### 3. Backend Implementation

#### Package.json
```json
{
  "name": "foam-crm-backend",
  "version": "1.0.0",
  "description": "Foam CRM SaaS Backend API",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "migrate": "node dist/migrations/migrate.js",
    "seed": "node dist/seeds/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "joi": "^17.11.0",
    "multer": "^1.4.5-lts.1",
    "aws-sdk": "^2.1480.0",
    "nodemailer": "^6.9.7",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/pg": "^8.10.7",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14",
    "typescript": "^5.2.2",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1"
  }
}
```

#### Main App Setup
```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Route imports
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customers.routes';
import jobRoutes from './routes/jobs.routes';
import organizationRoutes from './routes/organizations.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/organizations', organizationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
```

#### Authentication Controller
```typescript
// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

export class AuthController {
  private authService = new AuthService();
  private dbService = new DatabaseService();
  private emailService = new EmailService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, organizationName } = req.body;

      // Check if user exists
      const existingUser = await this.dbService.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user and organization in transaction
      const client = await this.dbService.getClient();
      await client.query('BEGIN');

      try {
        // Create user
        const userResult = await client.query(
          'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
          [email, passwordHash, name]
        );
        const user = userResult.rows[0];

        // Create organization
        const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '-');
        const orgResult = await client.query(
          'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug',
          [organizationName, orgSlug]
        );
        const organization = orgResult.rows[0];

        // Add user as organization owner
        await client.query(
          'INSERT INTO organization_members (user_id, organization_id, role) VALUES ($1, $2, $3)',
          [user.id, organization.id, 'owner']
        );

        // Create tenant schema
        await client.query('SELECT create_tenant_schema($1)', [organization.id]);

        await client.query('COMMIT');

        // Generate JWT
        const token = this.authService.generateToken({
          userId: user.id,
          organizationId: organization.id,
          role: 'owner',
          permissions: ['*'] // Owner has all permissions
        });

        res.status(201).json({
          user,
          organization,
          token,
          message: 'Registration successful'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Get user with organization membership
      const result = await this.dbService.query(`
        SELECT u.id, u.email, u.name, u.password_hash,
               o.id as org_id, o.name as org_name, o.slug as org_slug,
               om.role, om.permissions
        FROM users u
        JOIN organization_members om ON u.id = om.user_id
        JOIN organizations o ON om.organization_id = o.id
        WHERE u.email = $1
      `, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = this.authService.generateToken({
        userId: user.id,
        organizationId: user.org_id,
        role: user.role,
        permissions: user.permissions || []
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        organization: {
          id: user.org_id,
          name: user.org_name,
          slug: user.org_slug
        },
        token,
        role: user.role
      });

    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Generate new token
      const newToken = this.authService.generateToken({
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
        permissions: decoded.permissions
      });

      res.json({ token: newToken });

    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };
}
```

#### Database Service
```typescript
// src/services/database.service.ts
import { Pool, PoolClient } from 'pg';
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
    });
  }

  async query(text: string, params?: any[]) {
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
      });
      this.tenantPools.set(organizationId, tenantPool);
    }

    const pool = this.tenantPools.get(organizationId)!;
    const client = await pool.connect();
    
    // Set schema for this connection
    await client.query(`SET search_path TO ${schemaName}`);
    
    return client;
  }
}
```

## Frontend Modifications

### 1. Update API Service Layer

#### Modified lib/api.ts
```typescript
// lib/api.ts
import { CustomerInfo } from '../components/EstimatePDF';
import { EstimateRecord, InventoryItem } from './db';
import { Employee, Task, Automation } from '../components/types';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
let authToken: string | null = localStorage.getItem('authToken');

const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  ...(authToken && { 'Authorization': `Bearer ${authToken}` })
});

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

// Authentication API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(response);
    setAuthToken(data.token);
    return data;
  },

  register: async (email: string, password: string, name: string, organizationName: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, organizationName })
    });
    const data = await handleResponse(response);
    setAuthToken(data.token);
    return data;
  },

  logout: () => {
    setAuthToken(null);
  }
};

// Customer Operations (now with HTTP calls)
export const getCustomers = async (): Promise<CustomerInfo[]> => {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const addCustomer = async (customer: Omit<CustomerInfo, 'id'>): Promise<CustomerInfo> => {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(customer)
  });
  return handleResponse(response);
};

export const updateCustomer = async (customer: CustomerInfo): Promise<void> => {
  await fetch(`${API_BASE_URL}/customers/${customer.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(customer)
  });
};

// Job Operations
export const getJobs = async (): Promise<EstimateRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const addJob = async (jobData: Omit<EstimateRecord, 'id' | 'createdAt'>): Promise<EstimateRecord> => {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(jobData)
  });
  return handleResponse(response);
};

export const updateJob = async (jobId: number, updates: Partial<Omit<EstimateRecord, 'id'>>): Promise<EstimateRecord> => {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  return handleResponse(response);
};

export const deleteJob = async (jobId: number): Promise<void> => {
  await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};

// ... rest of the API functions updated similarly

export { setAuthToken };
```

### 2. Add Authentication Components

#### Login Component
```typescript
// components/LoginScreen.tsx
import React, { useState } from 'react';
import { authApi } from '../lib/api';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    organizationName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await authApi.login(formData.email, formData.password);
      } else {
        result = await authApi.register(
          formData.email,
          formData.password,
          formData.name,
          formData.organizationName
        );
      }

      onLogin(result);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Professional CRM for Spray Foam Contractors
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required={!isLogin}
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your company name"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3. Environment Configuration

#### .env files
```bash
# .env.local (frontend)
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Foam CRM

# .env (backend)
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/foam_crm_saas
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:5173
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=foam-crm-files
```

## Docker Setup

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: foam_crm_saas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/foam_crm_saas
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key-here
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json

volumes:
  postgres_data:
```

## Implementation Checklist

### Backend Setup ✅
- [ ] Initialize Node.js project with TypeScript
- [ ] Set up Express server with middleware
- [ ] Configure PostgreSQL connection
- [ ] Create database migration system
- [ ] Implement JWT authentication
- [ ] Create tenant schema creation function
- [ ] Build authentication controller
- [ ] Set up database service with tenant support
- [ ] Create basic CRUD controllers for customers
- [ ] Add error handling middleware
- [ ] Set up logging with Winston
- [ ] Configure Docker development environment

### Frontend Modifications ✅
- [ ] Update API service layer to use HTTP endpoints
- [ ] Add authentication state management
- [ ] Create login/register components
- [ ] Modify App.tsx for authentication flow
- [ ] Add loading states for API calls
- [ ] Implement error handling for network requests
- [ ] Add token refresh mechanism
- [ ] Update all components to use new API
- [ ] Add environment configuration
- [ ] Test offline fallback behavior

### Testing & Validation ✅
- [ ] Set up unit tests for backend
- [ ] Create integration tests for API endpoints
- [ ] Test multi-tenant data isolation
- [ ] Validate JWT token handling
- [ ] Test error scenarios and edge cases
- [ ] Perform security audit of authentication
- [ ] Load test database performance
- [ ] Validate frontend-backend integration

### Deployment Preparation ✅
- [ ] Set up CI/CD pipeline
- [ ] Configure staging environment
- [ ] Set up monitoring and logging
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Create deployment documentation
- [ ] Prepare rollback procedures

This completes the Phase 1 implementation guide. The next phase will focus on implementing complete multi-tenancy features, team management, and subscription handling.