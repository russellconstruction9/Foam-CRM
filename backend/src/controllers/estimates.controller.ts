import { Response } from 'express';
import { dbService } from '../services/database.service';
import { AuthenticatedRequest } from '../types';

export interface Estimate {
    id?: number;
    organization_id?: string;
    customer_id: number;
    job_id?: number;
    estimate_number: string;
    status?: string;
    estimate_pdf_data?: string;
    material_order_pdf_data?: string;
    invoice_pdf_data?: string;
    calc_data?: any;
    costs_data?: any;
    scope_of_work?: string;
    notes?: string;
    valid_until?: string;
    subtotal?: number;
    tax_amount?: number;
    total_amount?: number;
    created_at?: string;
    updated_at?: string;
}

export interface LineItem {
    id?: number;
    organization_id?: string;
    estimate_id: number;
    description: string;
    quantity?: number;
    unit_price: number;
    line_total: number;
    item_order?: number;
    category?: string;
    created_at?: string;
    updated_at?: string;
}

export class EstimatesController {
    // GET /api/estimates - Get all estimates for the user's organization
    static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { status, customer_id, limit = 50, offset = 0 } = req.query;
            
            let query = `
                SELECT e.id, e.organization_id, e.customer_id, e.job_id, e.estimate_number, 
                       e.status, e.subtotal, e.tax_amount, e.total_amount, e.valid_until,
                       e.created_at, e.updated_at, c.name as customer_name, j.name as job_name
                FROM estimates e
                JOIN customers c ON e.customer_id = c.id
                LEFT JOIN jobs j ON e.job_id = j.id
                WHERE e.organization_id = $1
            `;
            
            const params: any[] = [organizationId];
            
            if (status) {
                query += ` AND e.status = $${params.length + 1}`;
                params.push(status);
            }
            
            if (customer_id) {
                query += ` AND e.customer_id = $${params.length + 1}`;
                params.push(customer_id);
            }
            
            query += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
            
            const result = await dbService.query(query, params);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching estimates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch estimates',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/estimates/:id - Get a specific estimate with line items
    static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            // Get estimate details
            const estimateQuery = `
                SELECT e.*, c.name as customer_name, c.address as customer_address, 
                       c.email as customer_email, c.phone as customer_phone,
                       j.name as job_name
                FROM estimates e
                JOIN customers c ON e.customer_id = c.id
                LEFT JOIN jobs j ON e.job_id = j.id
                WHERE e.id = $1 AND e.organization_id = $2
            `;
            
            const estimateResult = await dbService.query(estimateQuery, [id, organizationId]);
            
            if (estimateResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Estimate not found'
                });
                return;
            }

            // Get line items
            const lineItemsQuery = `
                SELECT id, description, quantity, unit_price, line_total, item_order, category
                FROM line_items
                WHERE estimate_id = $1 AND organization_id = $2
                ORDER BY item_order ASC, id ASC
            `;
            
            const lineItemsResult = await dbService.query(lineItemsQuery, [id, organizationId]);
            
            const estimate = {
                ...estimateResult.rows[0],
                line_items: lineItemsResult.rows
            };
            
            res.json({
                success: true,
                data: estimate
            });
        } catch (error: any) {
            console.error('Error fetching estimate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch estimate',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/estimates - Create a new estimate
    static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { 
                customer_id, 
                job_id, 
                estimate_number, 
                status = 'estimate',
                calc_data,
                costs_data,
                scope_of_work,
                notes,
                valid_until,
                subtotal,
                tax_amount,
                total_amount,
                line_items = []
            }: Estimate & { line_items?: Omit<LineItem, 'estimate_id' | 'organization_id'>[] } = req.body;
            
            // Validation
            if (!customer_id || !estimate_number) {
                res.status(400).json({
                    success: false,
                    message: 'Customer ID and estimate number are required'
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

            // Start transaction
            await dbService.query('BEGIN');

            try {
                // Create estimate
                const estimateQuery = `
                    INSERT INTO estimates (
                        organization_id, customer_id, job_id, estimate_number, status,
                        calc_data, costs_data, scope_of_work, notes, valid_until,
                        subtotal, tax_amount, total_amount
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING id, organization_id, customer_id, job_id, estimate_number, status,
                              subtotal, tax_amount, total_amount, created_at, updated_at
                `;
                
                const estimateResult = await dbService.query(estimateQuery, [
                    organizationId,
                    customer_id,
                    job_id || null,
                    estimate_number,
                    status,
                    calc_data ? JSON.stringify(calc_data) : null,
                    costs_data ? JSON.stringify(costs_data) : null,
                    scope_of_work?.trim() || null,
                    notes?.trim() || null,
                    valid_until || null,
                    subtotal || null,
                    tax_amount || null,
                    total_amount || null
                ]);

                const estimate = estimateResult.rows[0];

                // Create line items if provided
                const createdLineItems = [];
                for (let i = 0; i < line_items.length; i++) {
                    const item = line_items[i];
                    if (!item) continue;
                    
                    const lineItemQuery = `
                        INSERT INTO line_items (
                            organization_id, estimate_id, description, quantity, 
                            unit_price, line_total, item_order, category
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING id, description, quantity, unit_price, line_total, item_order, category
                    `;
                    
                    const lineItemResult = await dbService.query(lineItemQuery, [
                        organizationId,
                        estimate.id,
                        item.description,
                        item.quantity || 1,
                        item.unit_price,
                        item.line_total,
                        item.item_order || i,
                        item.category || null
                    ]);
                    
                    createdLineItems.push(lineItemResult.rows[0]);
                }

                await dbService.query('COMMIT');
                
                res.status(201).json({
                    success: true,
                    data: {
                        ...estimate,
                        line_items: createdLineItems
                    },
                    message: 'Estimate created successfully'
                });
            } catch (error) {
                await dbService.query('ROLLBACK');
                throw error;
            }
        } catch (error: any) {
            console.error('Error creating estimate:', error);
            
            // Handle unique constraint violations
            if (error?.code === '23505') {
                res.status(409).json({
                    success: false,
                    message: 'An estimate with this number already exists'
                });
                return;
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to create estimate',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // PUT /api/estimates/:id - Update an estimate
    static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { 
                customer_id,
                job_id,
                estimate_number,
                status,
                calc_data,
                costs_data,
                scope_of_work,
                notes,
                valid_until,
                subtotal,
                tax_amount,
                total_amount
            }: Estimate = req.body;
            
            // Validation
            if (!customer_id || !estimate_number) {
                res.status(400).json({
                    success: false,
                    message: 'Customer ID and estimate number are required'
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
                UPDATE estimates 
                SET customer_id = $1, job_id = $2, estimate_number = $3, status = $4,
                    calc_data = $5, costs_data = $6, scope_of_work = $7, notes = $8,
                    valid_until = $9, subtotal = $10, tax_amount = $11, total_amount = $12,
                    updated_at = NOW()
                WHERE id = $13 AND organization_id = $14
                RETURNING id, organization_id, customer_id, job_id, estimate_number, status,
                          subtotal, tax_amount, total_amount, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                customer_id,
                job_id || null,
                estimate_number,
                status || 'estimate',
                calc_data ? JSON.stringify(calc_data) : null,
                costs_data ? JSON.stringify(costs_data) : null,
                scope_of_work?.trim() || null,
                notes?.trim() || null,
                valid_until || null,
                subtotal || null,
                tax_amount || null,
                total_amount || null,
                id,
                organizationId
            ]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Estimate not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Estimate updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating estimate:', error);
            
            // Handle unique constraint violations
            if (error?.code === '23505') {
                res.status(409).json({
                    success: false,
                    message: 'An estimate with this number already exists'
                });
                return;
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to update estimate',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // DELETE /api/estimates/:id - Delete an estimate
    static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            // Start transaction to delete estimate and line items
            await dbService.query('BEGIN');

            try {
                // Delete line items first (due to foreign key constraint)
                await dbService.query(
                    'DELETE FROM line_items WHERE estimate_id = $1 AND organization_id = $2',
                    [id, organizationId]
                );

                // Delete estimate
                const query = `
                    DELETE FROM estimates 
                    WHERE id = $1 AND organization_id = $2
                    RETURNING id
                `;
                
                const result = await dbService.query(query, [id, organizationId]);
                
                if (result.rows.length === 0) {
                    await dbService.query('ROLLBACK');
                    res.status(404).json({
                        success: false,
                        message: 'Estimate not found'
                    });
                    return;
                }

                await dbService.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Estimate deleted successfully'
                });
            } catch (error) {
                await dbService.query('ROLLBACK');
                throw error;
            }
        } catch (error: any) {
            console.error('Error deleting estimate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete estimate',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/estimates/:id/line-items - Add line item to estimate
    static async addLineItem(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { description, quantity = 1, unit_price, category }: Omit<LineItem, 'estimate_id' | 'organization_id'> = req.body;
            
            if (!description || unit_price === undefined) {
                res.status(400).json({
                    success: false,
                    message: 'Description and unit price are required'
                });
                return;
            }

            // Verify estimate exists
            const estimateCheck = await dbService.query(
                'SELECT id FROM estimates WHERE id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            if (estimateCheck.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Estimate not found'
                });
                return;
            }

            const line_total = quantity * unit_price;

            const query = `
                INSERT INTO line_items (organization_id, estimate_id, description, quantity, unit_price, line_total, category)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, description, quantity, unit_price, line_total, item_order, category, created_at
            `;
            
            const result = await dbService.query(query, [
                organizationId,
                id,
                description,
                quantity,
                unit_price,
                line_total,
                category || null
            ]);
            
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Line item added successfully'
            });
        } catch (error: any) {
            console.error('Error adding line item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add line item',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // PUT /api/estimates/:id/line-items/:lineItemId - Update line item
    static async updateLineItem(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id, lineItemId } = req.params;
            const organizationId = req.organization.id;
            const { description, quantity = 1, unit_price, category }: Omit<LineItem, 'estimate_id' | 'organization_id'> = req.body;
            
            if (!description || unit_price === undefined) {
                res.status(400).json({
                    success: false,
                    message: 'Description and unit price are required'
                });
                return;
            }

            const line_total = quantity * unit_price;

            const query = `
                UPDATE line_items 
                SET description = $1, quantity = $2, unit_price = $3, line_total = $4, category = $5, updated_at = NOW()
                WHERE id = $6 AND estimate_id = $7 AND organization_id = $8
                RETURNING id, description, quantity, unit_price, line_total, item_order, category, updated_at
            `;
            
            const result = await dbService.query(query, [
                description,
                quantity,
                unit_price,
                line_total,
                category || null,
                lineItemId,
                id,
                organizationId
            ]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Line item not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Line item updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating line item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update line item',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // DELETE /api/estimates/:id/line-items/:lineItemId - Delete line item
    static async deleteLineItem(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id, lineItemId } = req.params;
            const organizationId = req.organization.id;
            
            const query = `
                DELETE FROM line_items 
                WHERE id = $1 AND estimate_id = $2 AND organization_id = $3
                RETURNING id
            `;
            
            const result = await dbService.query(query, [lineItemId, id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Line item not found'
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'Line item deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting line item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete line item',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }
}