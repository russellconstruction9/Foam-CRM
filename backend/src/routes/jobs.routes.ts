import { Router } from 'express';
import { JobsController } from '../controllers/jobs.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/jobs - Get all jobs
router.get('/', JobsController.getAll as any);

// GET /api/jobs/:id - Get specific job
router.get('/:id', JobsController.getById as any);

// GET /api/jobs/:id/time-entries - Get job time entries
router.get('/:id/time-entries', JobsController.getTimeEntries as any);

// POST /api/jobs - Create new job
// Require admin or manager role for creating jobs
router.post('/', requireRole(['owner', 'admin', 'manager']), JobsController.create as any);

// PUT /api/jobs/:id - Update job
// Require admin or manager role for updating jobs
router.put('/:id', requireRole(['owner', 'admin', 'manager']), JobsController.update as any);

// DELETE /api/jobs/:id - Delete job
// Require admin or owner role for deleting jobs
router.delete('/:id', requireRole(['owner', 'admin']), JobsController.delete as any);

export default router;