import { Request, Response } from 'express';
import { dbService } from '../services/database.service';
import { AuthenticatedRequest } from '../types';

export interface Customer {
    id?: number;
    organization_id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    lat?: number;
    lng?: number;
    created_at?: string;
    updated_at?: string;
}

export class CustomersController {
    // GET /api/customers - Get all customers for the user's organization
    static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            
            const query = `
                SELECT id, organization_id, name, email, phone, address, notes, lat, lng, created_at, updated_at
                FROM customers 
                WHERE organization_id = $1 
                ORDER BY name ASC
            `;
            
            const result = await dbService.query(query, [organizationId]);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching customers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch customers',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/customers/:id - Get a specific customer
    static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            const query = `
                SELECT id, organization_id, name, email, phone, address, notes, lat, lng, created_at, updated_at
                FROM customers 
                WHERE id = $1 AND organization_id = $2
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error: any) {
            console.error('Error fetching customer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch customer',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/customers - Create a new customer
    static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { name, email, phone, address, notes, lat, lng }: Customer = req.body;
            
            // Validation
            if (!name || name.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Customer name is required'
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
                INSERT INTO customers (organization_id, name, email, phone, address, notes, lat, lng)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, organization_id, name, email, phone, address, notes, lat, lng, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                organizationId,
                name.trim(),
                email?.trim() || null,
                phone?.trim() || null,
                address?.trim() || null,
                notes?.trim() || null,
                lat || null,
                lng || null
            ]);
            
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Customer created successfully'
            });
        } catch (error: any) {
            console.error('Error creating customer:', error);
            
            // Handle unique constraint violations
            if (error?.code === '23505') {
                res.status(409).json({
                    success: false,
                    message: 'A customer with this information already exists'
                });
                return;
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to create customer',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // PUT /api/customers/:id - Update a customer
    static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { name, email, phone, address, notes, lat, lng }: Customer = req.body;
            
            // Validation
            if (!name || name.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Customer name is required'
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
                UPDATE customers 
                SET name = $1, email = $2, phone = $3, address = $4, notes = $5, lat = $6, lng = $7, updated_at = NOW()
                WHERE id = $8 AND organization_id = $9
                RETURNING id, organization_id, name, email, phone, address, notes, lat, lng, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                name.trim(),
                email?.trim() || null,
                phone?.trim() || null,
                address?.trim() || null,
                notes?.trim() || null,
                lat || null,
                lng || null,
                id,
                organizationId
            ]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Customer updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating customer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update customer',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // DELETE /api/customers/:id - Delete a customer
    static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            // Check if customer has associated jobs/estimates
            const checkQuery = `
                SELECT COUNT(*) as count FROM (
                    SELECT 1 FROM jobs WHERE customer_id = $1 AND organization_id = $2
                    UNION ALL
                    SELECT 1 FROM estimates WHERE customer_id = $1 AND organization_id = $2
                ) as related
            `;
            
            const checkResult = await dbService.query(checkQuery, [id, organizationId]);
            const hasRelatedRecords = parseInt(checkResult.rows[0].count) > 0;
            
            if (hasRelatedRecords) {
                res.status(409).json({
                    success: false,
                    message: 'Cannot delete customer with associated jobs or estimates. Please delete related records first.'
                });
                return;
            }
            
            const query = `
                DELETE FROM customers 
                WHERE id = $1 AND organization_id = $2
                RETURNING id
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'Customer deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete customer',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/customers/:id/estimates - Get all estimates for a customer
    static async getEstimates(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            const query = `
                SELECT e.id, e.estimate_number, e.status, e.total_amount, e.created_at, e.valid_until,
                       c.name as customer_name
                FROM estimates e
                JOIN customers c ON e.customer_id = c.id
                WHERE e.customer_id = $1 AND e.organization_id = $2
                ORDER BY e.created_at DESC
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching customer estimates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch customer estimates',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }
}