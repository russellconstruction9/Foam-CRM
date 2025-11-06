import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Inventory item routes
router.get('/', InventoryController.getAll as any);
router.post('/', InventoryController.create as any);
router.get('/low-stock', InventoryController.getLowStock as any);
router.get('/categories', InventoryController.getCategories as any);
router.get('/:id', InventoryController.getById as any);
router.put('/:id', InventoryController.update as any);
router.delete('/:id', InventoryController.delete as any);

// Stock transaction routes
router.post('/:id/stock-transaction', InventoryController.recordStockTransaction as any);

export default router;