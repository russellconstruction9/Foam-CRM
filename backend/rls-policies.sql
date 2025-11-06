-- Row Level Security (RLS) Setup for Foam CRM
-- This script enables RLS and creates secure policies for all tables

-- Enable RLS on all main tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization IDs
CREATE OR REPLACE FUNCTION get_current_user_organization_ids()
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For service_role, return all organizations (bypass RLS)
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN ARRAY(SELECT id FROM organizations);
  END IF;
  
  -- For authenticated users, return their organization IDs
  RETURN ARRAY(
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Helper function to check if user can access organization
CREATE OR REPLACE FUNCTION can_access_organization(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Service role can access everything
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN true;
  END IF;
  
  -- Check if user is member of organization
  RETURN EXISTS(
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
END;
$$;

-- Organizations policies
CREATE POLICY "Organizations: Users can view their own organizations" 
  ON public.organizations FOR SELECT 
  USING (id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Organizations: Users can update their own organizations" 
  ON public.organizations FOR UPDATE 
  USING (id = ANY(get_current_user_organization_ids()));

-- Users policies (users can only see themselves)
CREATE POLICY "Users: Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users: Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (id = auth.uid());

-- Organization members policies
CREATE POLICY "Members: Users can view members of their organizations" 
  ON public.organization_members FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Members: Users can insert members to their organizations" 
  ON public.organization_members FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

-- Customers policies
CREATE POLICY "Customers: Users can view customers in their organizations" 
  ON public.customers FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Customers: Users can insert customers in their organizations" 
  ON public.customers FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Customers: Users can update customers in their organizations" 
  ON public.customers FOR UPDATE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Customers: Users can delete customers in their organizations" 
  ON public.customers FOR DELETE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

-- Jobs policies
CREATE POLICY "Jobs: Users can view jobs in their organizations" 
  ON public.jobs FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Jobs: Users can insert jobs in their organizations" 
  ON public.jobs FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Jobs: Users can update jobs in their organizations" 
  ON public.jobs FOR UPDATE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Jobs: Users can delete jobs in their organizations" 
  ON public.jobs FOR DELETE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

-- Employees policies
CREATE POLICY "Employees: Users can view employees in their organizations" 
  ON public.employees FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Employees: Users can insert employees in their organizations" 
  ON public.employees FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Employees: Users can update employees in their organizations" 
  ON public.employees FOR UPDATE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Employees: Users can delete employees in their organizations" 
  ON public.employees FOR DELETE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

-- Time entries policies
CREATE POLICY "Time entries: Users can view time entries in their organizations" 
  ON public.time_entries FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Time entries: Users can insert time entries in their organizations" 
  ON public.time_entries FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Time entries: Users can update time entries in their organizations" 
  ON public.time_entries FOR UPDATE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

-- Estimates policies
CREATE POLICY "Estimates: Users can view estimates in their organizations" 
  ON public.estimates FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Estimates: Users can insert estimates in their organizations" 
  ON public.estimates FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Estimates: Users can update estimates in their organizations" 
  ON public.estimates FOR UPDATE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Estimates: Users can delete estimates in their organizations" 
  ON public.estimates FOR DELETE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

-- Estimate line items policies
CREATE POLICY "Line items: Users can view line items for estimates in their organizations" 
  ON public.estimate_line_items FOR SELECT 
  USING (estimate_id IN (
    SELECT id FROM estimates 
    WHERE organization_id = ANY(get_current_user_organization_ids())
  ));

CREATE POLICY "Line items: Users can insert line items for estimates in their organizations" 
  ON public.estimate_line_items FOR INSERT 
  WITH CHECK (estimate_id IN (
    SELECT id FROM estimates 
    WHERE organization_id = ANY(get_current_user_organization_ids())
  ));

CREATE POLICY "Line items: Users can update line items for estimates in their organizations" 
  ON public.estimate_line_items FOR UPDATE 
  USING (estimate_id IN (
    SELECT id FROM estimates 
    WHERE organization_id = ANY(get_current_user_organization_ids())
  ));

CREATE POLICY "Line items: Users can delete line items for estimates in their organizations" 
  ON public.estimate_line_items FOR DELETE 
  USING (estimate_id IN (
    SELECT id FROM estimates 
    WHERE organization_id = ANY(get_current_user_organization_ids())
  ));

-- Inventory items policies
CREATE POLICY "Inventory: Users can view inventory in their organizations" 
  ON public.inventory_items FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Inventory: Users can insert inventory in their organizations" 
  ON public.inventory_items FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Inventory: Users can update inventory in their organizations" 
  ON public.inventory_items FOR UPDATE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Inventory: Users can delete inventory in their organizations" 
  ON public.inventory_items FOR DELETE 
  USING (organization_id = ANY(get_current_user_organization_ids()));

-- Stock transactions policies
CREATE POLICY "Stock: Users can view stock transactions in their organizations" 
  ON public.stock_transactions FOR SELECT 
  USING (organization_id = ANY(get_current_user_organization_ids()));

CREATE POLICY "Stock: Users can insert stock transactions in their organizations" 
  ON public.stock_transactions FOR INSERT 
  WITH CHECK (organization_id = ANY(get_current_user_organization_ids()));

-- Create indexes for performance (policy columns)
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON public.jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON public.time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_estimates_organization_id ON public.estimates(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_organization_id ON public.inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_organization_id ON public.stock_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke unnecessary permissions from anon role for sensitive tables
REVOKE ALL ON public.organizations FROM anon;
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.organization_members FROM anon;

-- Allow anon role limited access only to auth-related operations
-- (This will be handled by your auth endpoints)

COMMENT ON FUNCTION get_current_user_organization_ids() IS 'Returns organization IDs that the current user can access';
COMMENT ON FUNCTION can_access_organization(uuid) IS 'Checks if current user can access specified organization';