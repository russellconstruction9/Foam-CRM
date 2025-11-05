import { Router, RequestHandler } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/customers - Get all customers
router.get('/', CustomersController.getAll as any);

// GET /api/customers/:id - Get specific customer
router.get('/:id', CustomersController.getById as any);

// GET /api/customers/:id/estimates - Get customer estimates
router.get('/:id/estimates', CustomersController.getEstimates as any);

// POST /api/customers - Create new customer
// Require admin or manager role for creating customers
router.post('/', requireRole(['owner', 'admin', 'manager']), CustomersController.create as any);

// PUT /api/customers/:id - Update customer
// Require admin or manager role for updating customers
router.put('/:id', requireRole(['owner', 'admin', 'manager']), CustomersController.update as any);

// DELETE /api/customers/:id - Delete customer
// Require admin or owner role for deleting customers
router.delete('/:id', requireRole(['owner', 'admin']), CustomersController.delete as any);

export default router;