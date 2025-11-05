-- Initial database schema for Foam CRM SaaS
-- Run this script against your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Global tables (shared across all tenants)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
    trial_ends_at TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS organization_members (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);

-- Function to create tenant schema with all necessary tables
CREATE OR REPLACE FUNCTION create_tenant_schema(org_id UUID)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT := 'org_' || replace(org_id::text, '-', '_');
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Create customers table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.customers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            email VARCHAR(255),
            phone VARCHAR(50),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name);
    
    -- Create estimates/jobs table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.estimates (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES %I.customers(id) ON DELETE CASCADE,
            estimate_number VARCHAR(100) NOT NULL,
            estimate_pdf_url VARCHAR(500),
            material_order_pdf_url VARCHAR(500),
            invoice_pdf_url VARCHAR(500),
            calc_data JSONB NOT NULL DEFAULT ''{}''::jsonb,
            costs_data JSONB NOT NULL DEFAULT ''{}''::jsonb,
            scope_of_work TEXT,
            status VARCHAR(50) DEFAULT ''estimate'' CHECK (status IN (''estimate'', ''sold'', ''invoiced'', ''paid'')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name, schema_name);
    
    -- Create employees table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(100) NOT NULL,
            pin VARCHAR(4) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name);
    
    -- Create inventory table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.inventory (
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
        CREATE TABLE IF NOT EXISTS %I.tasks (
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
        CREATE TABLE IF NOT EXISTS %I.automations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            trigger_type VARCHAR(100) NOT NULL,
            trigger_config JSONB DEFAULT ''{}''::jsonb,
            action_type VARCHAR(100) NOT NULL,
            action_config JSONB DEFAULT ''{}''::jsonb,
            is_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name);
    
    -- Create time_log table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.time_log (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER REFERENCES %I.employees(id) ON DELETE CASCADE,
            job_id INTEGER,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            start_lat DECIMAL(10, 8),
            start_lng DECIMAL(11, 8),
            end_lat DECIMAL(10, 8),
            end_lng DECIMAL(11, 8),
            duration_hours DECIMAL(5, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', schema_name, schema_name);
    
    -- Create indexes for tenant tables
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_customers_name ON %I.customers(name)', 
                   replace(schema_name, 'org_', ''), schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_estimates_customer_id ON %I.estimates(customer_id)', 
                   replace(schema_name, 'org_', ''), schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_estimates_status ON %I.estimates(status)', 
                   replace(schema_name, 'org_', ''), schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tasks_completed ON %I.tasks(completed)', 
                   replace(schema_name, 'org_', ''), schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_time_log_employee_id ON %I.time_log(employee_id)', 
                   replace(schema_name, 'org_', ''), schema_name);
    
    RAISE NOTICE 'Created tenant schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on global tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create triggers for tenant tables
CREATE OR REPLACE FUNCTION create_tenant_triggers(org_id UUID)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT := 'org_' || replace(org_id::text, '-', '_');
BEGIN
    -- Create triggers for all tenant tables with updated_at
    EXECUTE format('
        CREATE TRIGGER update_%I_customers_updated_at BEFORE UPDATE ON %I.customers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        replace(schema_name, 'org_', ''), schema_name);
    
    EXECUTE format('
        CREATE TRIGGER update_%I_estimates_updated_at BEFORE UPDATE ON %I.estimates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        replace(schema_name, 'org_', ''), schema_name);
    
    EXECUTE format('
        CREATE TRIGGER update_%I_employees_updated_at BEFORE UPDATE ON %I.employees
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        replace(schema_name, 'org_', ''), schema_name);
    
    EXECUTE format('
        CREATE TRIGGER update_%I_inventory_updated_at BEFORE UPDATE ON %I.inventory
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        replace(schema_name, 'org_', ''), schema_name);
    
    RAISE NOTICE 'Created triggers for tenant schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;