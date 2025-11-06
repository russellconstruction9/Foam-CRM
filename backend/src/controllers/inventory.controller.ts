import { Response } from 'express';
import { dbService } from '../services/database.service';
import { AuthenticatedRequest } from '../types';

export interface InventoryItem {
    id?: number;
    organization_id?: string;
    name: string;
    description?: string;
    category?: string;
    unit_of_measure?: string;
    current_stock?: number;
    minimum_stock?: number;
    cost_per_unit?: number;
    supplier_info?: any;
    barcode?: string;
    location?: string;
    notes?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface StockTransaction {
    id?: number;
    organization_id?: string;
    inventory_item_id: number;
    transaction_type: 'purchase' | 'usage' | 'adjustment' | 'return';
    quantity_change: number;
    unit_cost?: number;
    total_cost?: number;
    reference_id?: number;
    reference_type?: string;
    notes?: string;
    employee_id?: number;
    created_at?: string;
}

export interface MaterialOrder {
    id?: number;
    organization_id?: string;
    supplier_name: string;
    supplier_contact?: string;
    order_number?: string;
    status?: string;
    order_date?: string;
    expected_delivery?: string;
    total_cost?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface MaterialOrderItem {
    id?: number;
    organization_id?: string;
    material_order_id: number;
    inventory_item_id: number;
    quantity_ordered: number;
    unit_cost: number;
    line_total: number;
    quantity_received?: number;
    created_at?: string;
}

export class InventoryController {
    // GET /api/inventory - Get all inventory items for the user's organization
    static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { category, is_active = 'true', limit = 50, offset = 0, search } = req.query;
            
            let query = `
                SELECT id, organization_id, name, description, category, unit_of_measure,
                       current_stock, minimum_stock, cost_per_unit, barcode, location,
                       is_active, created_at, updated_at
                FROM inventory_items
                WHERE organization_id = $1
            `;
            
            const params: any[] = [organizationId];
            
            if (category) {
                query += ` AND category = $${params.length + 1}`;
                params.push(category);
            }
            
            if (is_active !== 'all') {
                query += ` AND is_active = $${params.length + 1}`;
                params.push(is_active === 'true');
            }
            
            if (search) {
                query += ` AND (name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
                params.push(`%${search}%`);
            }
            
            query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
            
            const result = await dbService.query(query, params);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching inventory items:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch inventory items',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/inventory/:id - Get a specific inventory item with stock transactions
    static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            // Get inventory item details
            const itemQuery = `
                SELECT id, organization_id, name, description, category, unit_of_measure,
                       current_stock, minimum_stock, cost_per_unit, supplier_info, barcode,
                       location, notes, is_active, created_at, updated_at
                FROM inventory_items
                WHERE id = $1 AND organization_id = $2
            `;
            
            const itemResult = await dbService.query(itemQuery, [id, organizationId]);
            
            if (itemResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Inventory item not found'
                });
                return;
            }

            // Get recent stock transactions
            const transactionsQuery = `
                SELECT st.id, st.transaction_type, st.quantity_change, st.unit_cost, st.total_cost,
                       st.reference_id, st.reference_type, st.notes, st.created_at,
                       e.name as employee_name
                FROM stock_transactions st
                LEFT JOIN employees e ON st.employee_id = e.id
                WHERE st.inventory_item_id = $1 AND st.organization_id = $2
                ORDER BY st.created_at DESC
                LIMIT 20
            `;
            
            const transactionsResult = await dbService.query(transactionsQuery, [id, organizationId]);
            
            const inventoryItem = {
                ...itemResult.rows[0],
                recent_transactions: transactionsResult.rows
            };
            
            res.json({
                success: true,
                data: inventoryItem
            });
        } catch (error: any) {
            console.error('Error fetching inventory item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch inventory item',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/inventory - Create a new inventory item
    static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            const { 
                name, 
                description, 
                category, 
                unit_of_measure, 
                current_stock = 0, 
                minimum_stock = 0, 
                cost_per_unit, 
                supplier_info, 
                barcode, 
                location, 
                notes 
            }: InventoryItem = req.body;
            
            // Validation
            if (!name?.trim()) {
                res.status(400).json({
                    success: false,
                    message: 'Item name is required'
                });
                return;
            }
            
            const query = `
                INSERT INTO inventory_items (
                    organization_id, name, description, category, unit_of_measure,
                    current_stock, minimum_stock, cost_per_unit, supplier_info,
                    barcode, location, notes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id, organization_id, name, description, category, unit_of_measure,
                          current_stock, minimum_stock, cost_per_unit, barcode, location,
                          is_active, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                organizationId,
                name.trim(),
                description?.trim() || null,
                category?.trim() || null,
                unit_of_measure?.trim() || null,
                current_stock,
                minimum_stock,
                cost_per_unit || null,
                supplier_info ? JSON.stringify(supplier_info) : null,
                barcode?.trim() || null,
                location?.trim() || null,
                notes?.trim() || null
            ]);
            
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Inventory item created successfully'
            });
        } catch (error: any) {
            console.error('Error creating inventory item:', error);
            
            // Handle unique constraint violations
            if (error?.code === '23505') {
                if (error?.constraint?.includes('barcode')) {
                    res.status(409).json({
                        success: false,
                        message: 'An item with this barcode already exists'
                    });
                    return;
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to create inventory item',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // PUT /api/inventory/:id - Update an inventory item
    static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { 
                name, 
                description, 
                category, 
                unit_of_measure, 
                minimum_stock, 
                cost_per_unit, 
                supplier_info, 
                barcode, 
                location, 
                notes, 
                is_active 
            }: InventoryItem = req.body;
            
            // Validation
            if (!name?.trim()) {
                res.status(400).json({
                    success: false,
                    message: 'Item name is required'
                });
                return;
            }
            
            const query = `
                UPDATE inventory_items 
                SET name = $1, description = $2, category = $3, unit_of_measure = $4,
                    minimum_stock = $5, cost_per_unit = $6, supplier_info = $7,
                    barcode = $8, location = $9, notes = $10, is_active = $11,
                    updated_at = NOW()
                WHERE id = $12 AND organization_id = $13
                RETURNING id, organization_id, name, description, category, unit_of_measure,
                          current_stock, minimum_stock, cost_per_unit, barcode, location,
                          is_active, created_at, updated_at
            `;
            
            const result = await dbService.query(query, [
                name.trim(),
                description?.trim() || null,
                category?.trim() || null,
                unit_of_measure?.trim() || null,
                minimum_stock || 0,
                cost_per_unit || null,
                supplier_info ? JSON.stringify(supplier_info) : null,
                barcode?.trim() || null,
                location?.trim() || null,
                notes?.trim() || null,
                is_active !== undefined ? is_active : true,
                id,
                organizationId
            ]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Inventory item not found'
                });
                return;
            }
            
            res.json({
                success: true,
                data: result.rows[0],
                message: 'Inventory item updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating inventory item:', error);
            
            // Handle unique constraint violations
            if (error?.code === '23505') {
                if (error?.constraint?.includes('barcode')) {
                    res.status(409).json({
                        success: false,
                        message: 'An item with this barcode already exists'
                    });
                    return;
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to update inventory item',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // DELETE /api/inventory/:id - Delete an inventory item
    static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            
            // Check if item has any stock transactions
            const transactionCheck = await dbService.query(
                'SELECT COUNT(*) as count FROM stock_transactions WHERE inventory_item_id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            if (parseInt(transactionCheck.rows[0].count) > 0) {
                // Don't delete items with transaction history, just deactivate
                const query = `
                    UPDATE inventory_items 
                    SET is_active = false, updated_at = NOW()
                    WHERE id = $1 AND organization_id = $2
                    RETURNING id
                `;
                
                const result = await dbService.query(query, [id, organizationId]);
                
                if (result.rows.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: 'Inventory item not found'
                    });
                    return;
                }
                
                res.json({
                    success: true,
                    message: 'Inventory item deactivated successfully (item has transaction history)'
                });
                return;
            }

            // Delete item if no transaction history
            const query = `
                DELETE FROM inventory_items 
                WHERE id = $1 AND organization_id = $2
                RETURNING id
            `;
            
            const result = await dbService.query(query, [id, organizationId]);
            
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Inventory item not found'
                });
                return;
            }
            
            res.json({
                success: true,
                message: 'Inventory item deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting inventory item:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete inventory item',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // POST /api/inventory/:id/stock-transaction - Record a stock transaction
    static async recordStockTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const { 
                transaction_type, 
                quantity_change, 
                unit_cost, 
                reference_id, 
                reference_type, 
                notes 
            }: StockTransaction = req.body;
            
            // Validation
            if (!transaction_type || quantity_change === undefined) {
                res.status(400).json({
                    success: false,
                    message: 'Transaction type and quantity change are required'
                });
                return;
            }

            if (!['purchase', 'usage', 'adjustment', 'return'].includes(transaction_type)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid transaction type'
                });
                return;
            }

            // Verify inventory item exists
            const itemCheck = await dbService.query(
                'SELECT id, current_stock FROM inventory_items WHERE id = $1 AND organization_id = $2',
                [id, organizationId]
            );

            if (itemCheck.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Inventory item not found'
                });
                return;
            }

            const currentStock = itemCheck.rows[0].current_stock || 0;
            const newStock = currentStock + quantity_change;

            // Prevent negative stock unless it's an adjustment
            if (newStock < 0 && transaction_type !== 'adjustment') {
                res.status(400).json({
                    success: false,
                    message: 'Insufficient stock for this transaction'
                });
                return;
            }

            // Start transaction
            await dbService.query('BEGIN');

            try {
                // Calculate total cost
                const totalCost = unit_cost ? Math.abs(quantity_change) * unit_cost : null;

                // Record stock transaction
                const transactionQuery = `
                    INSERT INTO stock_transactions (
                        organization_id, inventory_item_id, transaction_type, quantity_change,
                        unit_cost, total_cost, reference_id, reference_type, notes, employee_id
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id, transaction_type, quantity_change, unit_cost, total_cost,
                              reference_id, reference_type, notes, created_at
                `;
                
                const transactionResult = await dbService.query(transactionQuery, [
                    organizationId,
                    id,
                    transaction_type,
                    quantity_change,
                    unit_cost || null,
                    totalCost,
                    reference_id || null,
                    reference_type || null,
                    notes?.trim() || null,
                    req.user.id
                ]);

                // Update inventory stock
                const updateStockQuery = `
                    UPDATE inventory_items 
                    SET current_stock = current_stock + $1, updated_at = NOW()
                    WHERE id = $2 AND organization_id = $3
                    RETURNING current_stock
                `;
                
                const stockResult = await dbService.query(updateStockQuery, [
                    quantity_change,
                    id,
                    organizationId
                ]);

                await dbService.query('COMMIT');
                
                res.status(201).json({
                    success: true,
                    data: {
                        transaction: transactionResult.rows[0],
                        new_stock_level: stockResult.rows[0].current_stock
                    },
                    message: 'Stock transaction recorded successfully'
                });
            } catch (error) {
                await dbService.query('ROLLBACK');
                throw error;
            }
        } catch (error: any) {
            console.error('Error recording stock transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to record stock transaction',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/inventory/low-stock - Get items below minimum stock level
    static async getLowStock(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            
            const query = `
                SELECT id, name, category, unit_of_measure, current_stock, minimum_stock,
                       (minimum_stock - current_stock) as stock_shortage
                FROM inventory_items
                WHERE organization_id = $1 AND is_active = true 
                  AND current_stock <= minimum_stock AND minimum_stock > 0
                ORDER BY (minimum_stock - current_stock) DESC, name ASC
            `;
            
            const result = await dbService.query(query, [organizationId]);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error: any) {
            console.error('Error fetching low stock items:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch low stock items',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }

    // GET /api/inventory/categories - Get distinct categories
    static async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.organization.id;
            
            const query = `
                SELECT DISTINCT category
                FROM inventory_items
                WHERE organization_id = $1 AND category IS NOT NULL AND category != ''
                ORDER BY category ASC
            `;
            
            const result = await dbService.query(query, [organizationId]);
            
            res.json({
                success: true,
                data: result.rows.map(row => row.category)
            });
        } catch (error: any) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
            });
        }
    }
}