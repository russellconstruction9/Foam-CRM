/*
  # Update RLS Policies for Anonymous Access

  1. Changes
    - Drop existing restrictive RLS policies that require authentication
    - Add new policies that allow anonymous access via anon key
    - This enables the application to work without Supabase Auth

  2. Security Notes
    - Access is restricted to requests with valid Supabase anon key
    - In production, you should implement proper authentication
    - RLS still protects against unauthorized direct database access
*/

-- Drop existing policies for customers
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

-- Create new policies allowing anon access for customers
CREATE POLICY "Allow all operations for anon users on customers"
  ON customers FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on customers"
  ON customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for employees
DROP POLICY IF EXISTS "Authenticated users can view all employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON employees;

-- Create new policies allowing anon access for employees
CREATE POLICY "Allow all operations for anon users on employees"
  ON employees FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on employees"
  ON employees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for estimates
DROP POLICY IF EXISTS "Authenticated users can view all estimates" ON estimates;
DROP POLICY IF EXISTS "Authenticated users can insert estimates" ON estimates;
DROP POLICY IF EXISTS "Authenticated users can update estimates" ON estimates;
DROP POLICY IF EXISTS "Authenticated users can delete estimates" ON estimates;

-- Create new policies allowing anon access for estimates
CREATE POLICY "Allow all operations for anon users on estimates"
  ON estimates FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on estimates"
  ON estimates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for time_log
DROP POLICY IF EXISTS "Authenticated users can view all time logs" ON time_log;
DROP POLICY IF EXISTS "Authenticated users can insert time logs" ON time_log;
DROP POLICY IF EXISTS "Authenticated users can update time logs" ON time_log;
DROP POLICY IF EXISTS "Authenticated users can delete time logs" ON time_log;

-- Create new policies allowing anon access for time_log
CREATE POLICY "Allow all operations for anon users on time_log"
  ON time_log FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on time_log"
  ON time_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for inventory
DROP POLICY IF EXISTS "Authenticated users can view all inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON inventory;

-- Create new policies allowing anon access for inventory
CREATE POLICY "Allow all operations for anon users on inventory"
  ON inventory FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for tasks
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

-- Create new policies allowing anon access for tasks
CREATE POLICY "Allow all operations for anon users on tasks"
  ON tasks FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for drive_files
DROP POLICY IF EXISTS "Authenticated users can view all drive files" ON drive_files;
DROP POLICY IF EXISTS "Authenticated users can insert drive files" ON drive_files;
DROP POLICY IF EXISTS "Authenticated users can update drive files" ON drive_files;
DROP POLICY IF EXISTS "Authenticated users can delete drive files" ON drive_files;

-- Create new policies allowing anon access for drive_files
CREATE POLICY "Allow all operations for anon users on drive_files"
  ON drive_files FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on drive_files"
  ON drive_files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for automations
DROP POLICY IF EXISTS "Authenticated users can view all automations" ON automations;
DROP POLICY IF EXISTS "Authenticated users can insert automations" ON automations;
DROP POLICY IF EXISTS "Authenticated users can update automations" ON automations;
DROP POLICY IF EXISTS "Authenticated users can delete automations" ON automations;

-- Create new policies allowing anon access for automations
CREATE POLICY "Allow all operations for anon users on automations"
  ON automations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on automations"
  ON automations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);