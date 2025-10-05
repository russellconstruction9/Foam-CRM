/*
  # Add Numeric IDs for Compatibility

  1. Changes
    - Add numeric_id columns to all tables for app compatibility
    - Create sequences for auto-incrementing numeric IDs
    - Add triggers to automatically set numeric_id on insert
    - The UUID id remains the primary key for relationships

  2. Notes
    - This maintains compatibility with existing app code expecting numeric IDs
    - UUID primary keys are kept for better scalability and security
*/

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS customers_numeric_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS employees_numeric_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS estimates_numeric_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS time_log_numeric_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS inventory_numeric_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS tasks_numeric_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS drive_files_numeric_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS automations_numeric_id_seq START 1;

-- Add numeric_id columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('customers_numeric_id_seq');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('employees_numeric_id_seq');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimates' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE estimates ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('estimates_numeric_id_seq');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_log' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE time_log ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('time_log_numeric_id_seq');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE inventory ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('inventory_numeric_id_seq');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('tasks_numeric_id_seq');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drive_files' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE drive_files ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('drive_files_numeric_id_seq');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automations' AND column_name = 'numeric_id'
  ) THEN
    ALTER TABLE automations ADD COLUMN numeric_id integer UNIQUE DEFAULT nextval('automations_numeric_id_seq');
  END IF;
END $$;