import { Response } from 'express';
import { dbService } from '../services/database.service';
import { AuthenticatedRequest } from '../types';

export interface Job {
    id?: number;
    organization_id?: string;
    customer_id: number;
    name: string;
    start_date: string;
    end_date: string;
    color?: string;
    status?: string;
    assigned_team?: number[];
    links?: string[];
    description?: string;
    scope_of_work?: string;
    created_at?: string;
    updated_at?: string;
}

export class JobsController {
    // GET /api/jobs - Get all jobs for the user's organization
    static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            
            const query = `
                SELECT j.id, j.organization_id, j.customer_id, j.name, j.start_date, j.end_date, 
                       j.color, j.status, j.assigned_team, j.links, j.description, j.scope_of_work,
                       j.created_at, j.updated_at, c.name as customer_name
                FROM jobs j
                JOIN customers c ON j.customer_id = c.id
                WHERE j.organization_id = $1 
                ORDER BY j.start_date ASC
            `;
            
            const result = await dbService.query(query, [organizationId]);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching jobs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch jobs',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/jobs/:id - Get a specific job
    static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            const query = `
                SELECT j.id, j.organization_id, j.customer_id, j.name, j.start_date, j.end_date, 
                       j.color, j.status, j.assigned_team, j.links, j.description, j.scope_of_work,
                       j.created_at, j.updated_at, c.name as customer_name, c.address as customer_address
                FROM jobs j
                JOIN customers c ON j.customer_id = c.id
                WHERE j.id = $1 AND j.organization_id = $2
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Job not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error: any) {
            console.error('Error fetching job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch job',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/jobs - Create a new job
    static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { customer_id, name, start_date, end_date, color, status, assigned_team, links, description, scope_of_work }: Job = req.body;
            
            // Validation
            if (!customer_id || !name || !start_date || !end_date) {
                res.status(400).json({
                    success: false,
                    message: 'Customer ID, name, start date, and end date are required'
                });
                return;
            }

            // Verify customer exists and belongs to organization
            const customerCheck = await dbService.query(
                'SELECT id FROM customers WHERE id = $1 AND organization_id = $2',
                [customer_id, organizationId]
            );

            if (customerCheck.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }

            const query = `
                INSERT INTO jobs (organization_id, customer_id, name, start_date, end_date, color, status, assigned_team, links, description, scope_of_work)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id, organization_id, customer_id, name, start_date, end_date, color, status, assigned_team, links, description, scope_of_work, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                organizationId,
                customer_id,
                name.trim(),
                start_date,
                end_date,
                color || '#3B82F6',
                status || 'estimate',
                assigned_team || [],
                links || [],
                description?.trim() || null,
                scope_of_work?.trim() || null
            ]);
            
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Job created successfully'
            });
        } catch (error: any) {
            console.error('Error creating job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create job',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // PUT /api/jobs/:id - Update a job
    static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { customer_id, name, start_date, end_date, color, status, assigned_team, links, description, scope_of_work }: Job = req.body;
            
            // Validation
            if (!customer_id || !name || !start_date || !end_date) {
                res.status(400).json({
                    success: false,
                    message: 'Customer ID, name, start date, and end date are required'
                });
                return;
            }

            // Verify customer exists and belongs to organization
            const customerCheck = await dbService.query(
                'SELECT id FROM customers WHERE id = $1 AND organization_id = $2',
                [customer_id, organizationId]
            );

            if (customerCheck.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }
            
            const query = `
                UPDATE jobs 
                SET customer_id = $1, name = $2, start_date = $3, end_date = $4, color = $5, status = $6, 
                    assigned_team = $7, links = $8, description = $9, scope_of_work = $10, updated_at = NOW()
                WHERE id = $11 AND organization_id = $12
                RETURNING id, organization_id, customer_id, name, start_date, end_date, color, status, assigned_team, links, description, scope_of_work, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                customer_id,
                name.trim(),
                start_date,
                end_date,
                color || '#3B82F6',
                status || 'estimate',
                assigned_team || [],
                links || [],
                description?.trim() || null,
                scope_of_work?.trim() || null,
                id,
                organizationId
            ]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Job not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Job updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update job',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // DELETE /api/jobs/:id - Delete a job
    static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            const query = `
                DELETE FROM jobs 
                WHERE id = $1 AND organization_id = $2
                RETURNING id
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Job not found'
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'Job deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting job:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete job',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/jobs/:id/time-entries - Get time entries for a job
    static async getTimeEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            const query = `
                SELECT te.id, te.employee_id, te.start_time, te.end_time, te.duration_hours, 
                       te.start_lat, te.start_lng, te.end_lat, te.end_lng, te.notes,
                       e.name as employee_name
                FROM time_entries te
                JOIN employees e ON te.employee_id = e.id
                WHERE te.job_id = $1 AND te.organization_id = $2
                ORDER BY te.start_time DESC
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching job time entries:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch job time entries',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }
}