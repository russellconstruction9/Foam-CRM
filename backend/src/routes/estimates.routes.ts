import { Router } from 'express';
import { EstimatesController } from '../controllers/estimates.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Routes requiring admin/manager/owner permissions
router.get('/', EstimatesController.getAll as any);
router.post('/', EstimatesController.create as any);
router.get('/:id', EstimatesController.getById as any);
router.put('/:id', EstimatesController.update as any);
router.delete('/:id', EstimatesController.delete as any);

// Line item management routes
router.post('/:id/line-items', EstimatesController.addLineItem as any);
router.put('/:id/line-items/:lineItemId', EstimatesController.updateLineItem as any);
router.delete('/:id/line-items/:lineItemId', EstimatesController.deleteLineItem as any);

export default router;