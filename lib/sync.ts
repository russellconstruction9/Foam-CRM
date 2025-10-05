import { db } from './db';
import { supabaseApi } from './supabase-api';

export async function syncDexieToSupabase() {
  const results = {
    customers: { success: 0, failed: 0 },
    employees: { success: 0, failed: 0 },
    inventory: { success: 0, failed: 0 },
    tasks: { success: 0, failed: 0 },
    automations: { success: 0, failed: 0 },
  };

  try {
    const customers = await db.customers.toArray();
    for (const customer of customers) {
      try {
        await supabaseApi.customers.create({
          name: customer.name,
          address: customer.address,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
          lat: customer.lat,
          lng: customer.lng,
        });
        results.customers.success++;
      } catch (error) {
        console.error('Failed to sync customer:', customer.name, error);
        results.customers.failed++;
      }
    }
  } catch (error) {
    console.error('Failed to sync customers:', error);
  }

  try {
    const employees = await db.employees.toArray();
    for (const employee of employees) {
      try {
        await supabaseApi.employees.create({
          name: employee.name,
          role: employee.role,
          pin: employee.pin,
        });
        results.employees.success++;
      } catch (error) {
        console.error('Failed to sync employee:', employee.name, error);
        results.employees.failed++;
      }
    }
  } catch (error) {
    console.error('Failed to sync employees:', error);
  }

  try {
    const inventory = await db.inventory.toArray();
    for (const item of inventory) {
      try {
        await supabaseApi.inventory.create({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unitCost: item.unitCost,
          notes: item.notes,
        });
        results.inventory.success++;
      } catch (error) {
        console.error('Failed to sync inventory item:', item.name, error);
        results.inventory.failed++;
      }
    }
  } catch (error) {
    console.error('Failed to sync inventory:', error);
  }

  try {
    const tasks = await db.tasks.toArray();
    for (const task of tasks) {
      try {
        await supabaseApi.tasks.create({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo,
        });
        results.tasks.success++;
      } catch (error) {
        console.error('Failed to sync task:', task.title, error);
        results.tasks.failed++;
      }
    }
  } catch (error) {
    console.error('Failed to sync tasks:', error);
  }

  try {
    const automations = await db.automations.toArray();
    for (const automation of automations) {
      try {
        await supabaseApi.automations.create({
          name: automation.name,
          trigger_type: automation.trigger_type,
          trigger_config: automation.trigger_config,
          action_type: automation.action_type,
          action_config: automation.action_config,
          is_enabled: automation.is_enabled,
        });
        results.automations.success++;
      } catch (error) {
        console.error('Failed to sync automation:', automation.name, error);
        results.automations.failed++;
      }
    }
  } catch (error) {
    console.error('Failed to sync automations:', error);
  }

  return results;
}

export async function clearDexieData() {
  await db.customers.clear();
  await db.employees.clear();
  await db.estimates.clear();
  await db.time_log.clear();
  await db.inventory.clear();
  await db.tasks.clear();
  await db.drive_files.clear();
  await db.automations.clear();
}

export async function getDataCounts() {
  const [
    customersCount,
    employeesCount,
    estimatesCount,
    timeLogCount,
    inventoryCount,
    tasksCount,
    driveFilesCount,
    automationsCount,
  ] = await Promise.all([
    db.customers.count(),
    db.employees.count(),
    db.estimates.count(),
    db.time_log.count(),
    db.inventory.count(),
    db.tasks.count(),
    db.drive_files.count(),
    db.automations.count(),
  ]);

  return {
    customers: customersCount,
    employees: employeesCount,
    estimates: estimatesCount,
    timeLog: timeLogCount,
    inventory: inventoryCount,
    tasks: tasksCount,
    driveFiles: driveFilesCount,
    automations: automationsCount,
  };
}
