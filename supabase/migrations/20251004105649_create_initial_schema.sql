/*
  # Create Initial Foam CRM Schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `email` (text)
      - `phone` (text)
      - `notes` (text, optional)
      - `lat` (numeric, optional) - GPS latitude
      - `lng` (numeric, optional) - GPS longitude
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `employees`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `pin` (text) - 4-digit PIN for time clock
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `estimates`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `estimate_number` (text, unique)
      - `estimate_pdf` (bytea) - PDF blob
      - `material_order_pdf` (bytea) - PDF blob
      - `invoice_pdf` (bytea, optional) - PDF blob
      - `calc_data` (jsonb) - calculation results
      - `costs_data` (jsonb) - costs breakdown
      - `scope_of_work` (text)
      - `status` (text) - estimate, sold, invoiced, paid
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `time_log`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `job_id` (uuid, foreign key to estimates)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, optional)
      - `start_lat` (numeric, optional)
      - `start_lng` (numeric, optional)
      - `end_lat` (numeric, optional)
      - `end_lng` (numeric, optional)
      - `duration_hours` (numeric, optional)
      - `created_at` (timestamptz)
    
    - `inventory`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text)
      - `quantity` (numeric)
      - `unit_cost` (numeric, optional)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `due_date` (date, optional)
      - `completed` (boolean)
      - `assigned_to` (jsonb) - array of employee IDs
      - `completed_at` (timestamptz, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `drive_files`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `file_id` (text) - Google Drive file ID
      - `file_name` (text)
      - `web_link` (text)
      - `icon_link` (text)
      - `created_at` (timestamptz)
    
    - `automations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `trigger_type` (text) - new_customer, job_status_updated
      - `trigger_config` (jsonb)
      - `action_type` (text) - webhook, create_task, add_to_schedule, etc.
      - `action_config` (jsonb)
      - `is_enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'crew',
  pin text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create estimates table
CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  estimate_number text UNIQUE NOT NULL,
  estimate_pdf bytea,
  material_order_pdf bytea,
  invoice_pdf bytea,
  calc_data jsonb NOT NULL DEFAULT '{}',
  costs_data jsonb NOT NULL DEFAULT '{}',
  scope_of_work text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'estimate' CHECK (status IN ('estimate', 'sold', 'invoiced', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create time_log table
CREATE TABLE IF NOT EXISTS time_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  start_lat numeric,
  start_lng numeric,
  end_lat numeric,
  end_lng numeric,
  duration_hours numeric,
  created_at timestamptz DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  assigned_to jsonb NOT NULL DEFAULT '[]',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drive_files table
CREATE TABLE IF NOT EXISTS drive_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_id text NOT NULL,
  file_name text NOT NULL,
  web_link text NOT NULL,
  icon_link text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create automations table
CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('new_customer', 'job_status_updated')),
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_type text NOT NULL CHECK (action_type IN ('webhook', 'create_task', 'add_to_schedule', 'send_email', 'update_inventory', 'sync_to_calendar')),
  action_config jsonb NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_time_log_employee_id ON time_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_log_job_id ON time_log(job_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_drive_files_customer_id ON drive_files(customer_id);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for employees
CREATE POLICY "Authenticated users can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for estimates
CREATE POLICY "Authenticated users can view all estimates"
  ON estimates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert estimates"
  ON estimates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update estimates"
  ON estimates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete estimates"
  ON estimates FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for time_log
CREATE POLICY "Authenticated users can view all time logs"
  ON time_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert time logs"
  ON time_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update time logs"
  ON time_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete time logs"
  ON time_log FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for inventory
CREATE POLICY "Authenticated users can view all inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for tasks
CREATE POLICY "Authenticated users can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for drive_files
CREATE POLICY "Authenticated users can view all drive files"
  ON drive_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert drive files"
  ON drive_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update drive files"
  ON drive_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete drive files"
  ON drive_files FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for automations
CREATE POLICY "Authenticated users can view all automations"
  ON automations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert automations"
  ON automations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update automations"
  ON automations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete automations"
  ON automations FOR DELETE
  TO authenticated
  USING (true);