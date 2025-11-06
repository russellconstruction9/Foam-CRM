import { Response } from 'express';
import { dbService } from '../services/database.service';
import { AuthenticatedRequest } from '../types';

export interface Employee {
    id?: number;
    organization_id?: string;
    user_id?: string;
    name: string;
    role: string;
    pin: string;
    email?: string;
    phone?: string;
    hourly_rate?: number;
    is_active?: boolean;
    hire_date?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TimeEntry {
    id?: number;
    organization_id?: string;
    employee_id: number;
    job_id?: number;
    start_time: string;
    end_time?: string;
    start_lat?: number;
    start_lng?: number;
    end_lat?: number;
    end_lng?: number;
    duration_hours?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export class EmployeesController {
    // GET /api/employees - Get all employees for the user's organization
    static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            
            const query = `
                SELECT id, organization_id, user_id, name, role, pin, email, phone, 
                       hourly_rate, is_active, hire_date, created_at, updated_at
                FROM employees 
                WHERE organization_id = $1 
                ORDER BY name ASC
            `;
            
            const result = await dbService.query(query, [organizationId]);
            
            // Don't return PINs in list view for security
            const employees = result.rows.map(emp => ({
                ...emp,
                pin: undefined
            }));
            
            res.json({
                success: true,
                data: employees,
                count: employees.length
            });
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employees',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/employees/:id - Get a specific employee
    static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            const query = `
                SELECT id, organization_id, user_id, name, role, email, phone, 
                       hourly_rate, is_active, hire_date, created_at, updated_at
                FROM employees 
                WHERE id = $1 AND organization_id = $2
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error: any) {
            console.error('Error fetching employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employee',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/employees - Create a new employee
    static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { name, role, pin, email, phone, hourly_rate, hire_date }: Employee = req.body;
            
            // Validation
            if (!name || !role || !pin) {
                res.status(400).json({
                    success: false,
                    message: 'Name, role, and PIN are required'
                });
                return;
            }

            // Validate PIN format (4 digits)
            if (!/^\d{4}$/.test(pin)) {
                res.status(400).json({
                    success: false,
                    message: 'PIN must be exactly 4 digits'
                });
                return;
            }

            // Validate email format if provided
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
                return;
            }

            const query = `
                INSERT INTO employees (organization_id, name, role, pin, email, phone, hourly_rate, hire_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, organization_id, user_id, name, role, email, phone, hourly_rate, is_active, hire_date, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                organizationId,
                name.trim(),
                role.trim(),
                pin,
                email?.trim() || null,
                phone?.trim() || null,
                hourly_rate || null,
                hire_date || null
            ]);
            
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Employee created successfully'
            });
        } catch (error: any) {
            console.error('Error creating employee:', error);
            
            // Handle unique constraint violations (PIN must be unique per organization)
            if (error?.code === '23505') {
                res.status(409).json({
                    success: false,
                    message: 'An employee with this PIN already exists in your organization'
                });
                return;
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to create employee',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // PUT /api/employees/:id - Update an employee
    static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { name, role, pin, email, phone, hourly_rate, is_active, hire_date }: Employee = req.body;
            
            // Validation
            if (!name || !role || !pin) {
                res.status(400).json({
                    success: false,
                    message: 'Name, role, and PIN are required'
                });
                return;
            }

            // Validate PIN format (4 digits)
            if (!/^\d{4}$/.test(pin)) {
                res.status(400).json({
                    success: false,
                    message: 'PIN must be exactly 4 digits'
                });
                return;
            }

            // Validate email format if provided
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
                return;
            }
            
            const query = `
                UPDATE employees 
                SET name = $1, role = $2, pin = $3, email = $4, phone = $5, 
                    hourly_rate = $6, is_active = $7, hire_date = $8, updated_at = NOW()
                WHERE id = $9 AND organization_id = $10
                RETURNING id, organization_id, user_id, name, role, email, phone, hourly_rate, is_active, hire_date, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                name.trim(),
                role.trim(),
                pin,
                email?.trim() || null,
                phone?.trim() || null,
                hourly_rate || null,
                is_active !== undefined ? is_active : true,
                hire_date || null,
                id,
                organizationId
            ]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Employee updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating employee:', error);
            
            // Handle unique constraint violations
            if (error?.code === '23505') {
                res.status(409).json({
                    success: false,
                    message: 'An employee with this PIN already exists in your organization'
                });
                return;
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to update employee',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // DELETE /api/employees/:id - Delete an employee
    static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            // Check if employee has time entries
            const checkQuery = `
                SELECT COUNT(*) as count FROM time_entries 
                WHERE employee_id = $1 AND organization_id = $2
            `;
            
            const checkResult = await dbService.query(checkQuery, [id, organizationId]);
            const hasTimeEntries = parseInt(checkResult.rows[0].count) > 0;
            
            if (hasTimeEntries) {
                res.status(409).json({
                    success: false,
                    message: 'Cannot delete employee with existing time entries. Consider deactivating instead.'
                });
                return;
            }
            
            const query = `
                DELETE FROM employees 
                WHERE id = $1 AND organization_id = $2
                RETURNING id
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'Employee deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete employee',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/employees/clock-in - Clock in with PIN
    static async clockIn(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { pin, job_id, lat, lng }: { pin: string; job_id?: number; lat?: number; lng?: number } = req.body;
            
            if (!pin) {
                res.status(400).json({
                    success: false,
                    message: 'PIN is required'
                });
                return;
            }

            // Find employee by PIN
            const empQuery = `
                SELECT id, name FROM employees 
                WHERE pin = $1 AND organization_id = $2 AND is_active = true
            `;
            
            const empResult = await dbService.query(empQuery, [pin, organizationId]);
            
            if (empResult.rows.length === 0) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid PIN'
                });
                return;
            }

            const employee = empResult.rows[0];

            // Check if already clocked in
            const activeQuery = `
                SELECT id FROM time_entries 
                WHERE employee_id = $1 AND organization_id = $2 AND end_time IS NULL
            `;
            
            const activeResult = await dbService.query(activeQuery, [employee.id, organizationId]);
            
            if (activeResult.rows.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Employee is already clocked in'
                });
                return;
            }

            // Create new time entry
            const insertQuery = `
                INSERT INTO time_entries (organization_id, employee_id, job_id, start_time, start_lat, start_lng)
                VALUES ($1, $2, $3, NOW(), $4, $5)
                RETURNING id, employee_id, job_id, start_time, start_lat, start_lng
            `;
            
            const result = await dbService.query(insertQuery, [
                organizationId,
                employee.id,
                job_id || null,
                lat || null,
                lng || null
            ]);
            
            res.json({
                success: true,
                data: {
                    ...result.rows[0],
                    employee_name: employee.name
                },
                message: `${employee.name} clocked in successfully`
            });
        } catch (error: any) {
            console.error('Error clocking in:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clock in',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/employees/clock-out - Clock out with PIN
    static async clockOut(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { pin, lat, lng }: { pin: string; lat?: number; lng?: number } = req.body;
            
            if (!pin) {
                res.status(400).json({
                    success: false,
                    message: 'PIN is required'
                });
                return;
            }

            // Find employee by PIN
            const empQuery = `
                SELECT id, name FROM employees 
                WHERE pin = $1 AND organization_id = $2 AND is_active = true
            `;
            
            const empResult = await dbService.query(empQuery, [pin, organizationId]);
            
            if (empResult.rows.length === 0) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid PIN'
                });
                return;
            }

            const employee = empResult.rows[0];

            // Find active time entry
            const activeQuery = `
                SELECT id, start_time FROM time_entries 
                WHERE employee_id = $1 AND organization_id = $2 AND end_time IS NULL
            `;
            
            const activeResult = await dbService.query(activeQuery, [employee.id, organizationId]);
            
            if (activeResult.rows.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Employee is not currently clocked in'
                });
                return;
            }

            const timeEntry = activeResult.rows[0];

            // Calculate duration
            const startTime = new Date(timeEntry.start_time);
            const endTime = new Date();
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            // Update time entry
            const updateQuery = `
                UPDATE time_entries 
                SET end_time = NOW(), end_lat = $1, end_lng = $2, duration_hours = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING id, employee_id, job_id, start_time, end_time, duration_hours, start_lat, start_lng, end_lat, end_lng
            `;
            
            const result = await dbService.query(updateQuery, [
                lat || null,
                lng || null,
                Math.round(durationHours * 100) / 100, // Round to 2 decimal places
                timeEntry.id
            ]);
            
            res.json({
                success: true,
                data: {
                    ...result.rows[0],
                    employee_name: employee.name
                },
                message: `${employee.name} clocked out successfully`
            });
        } catch (error: any) {
            console.error('Error clocking out:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clock out',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/employees/:id/time-entries - Get time entries for an employee
    static async getTimeEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { start_date, end_date, limit = 50 } = req.query;
            
            let query = `
                SELECT te.id, te.employee_id, te.job_id, te.start_time, te.end_time, 
                       te.duration_hours, te.start_lat, te.start_lng, te.end_lat, te.end_lng, 
                       te.notes, j.name as job_name
                FROM time_entries te
                LEFT JOIN jobs j ON te.job_id = j.id
                WHERE te.employee_id = $1 AND te.organization_id = $2
            `;
            
            const params: any[] = [id, organizationId];
            
            if (start_date) {
                query += ` AND te.start_time >= $${params.length + 1}`;
                params.push(start_date);
            }
            
            if (end_date) {
                query += ` AND te.start_time <= $${params.length + 1}`;
                params.push(end_date);
            }
            
            query += ` ORDER BY te.start_time DESC LIMIT $${params.length + 1}`;
            params.push(limit);
            
            const result = await dbService.query(query, params);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching employee time entries:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employee time entries',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }
}