import { Router } from 'express';
import { EmployeesController } from '../controllers/employees.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/employees - Get all employees
router.get('/', EmployeesController.getAll as any);

// GET /api/employees/:id - Get specific employee
router.get('/:id', EmployeesController.getById as any);

// GET /api/employees/:id/time-entries - Get employee time entries
router.get('/:id/time-entries', EmployeesController.getTimeEntries as any);

// POST /api/employees/clock-in - Clock in with PIN (no role restriction needed)
router.post('/clock-in', EmployeesController.clockIn as any);

// POST /api/employees/clock-out - Clock out with PIN (no role restriction needed)
router.post('/clock-out', EmployeesController.clockOut as any);

// POST /api/employees - Create new employee
// Require admin or manager role for creating employees
router.post('/', requireRole(['owner', 'admin', 'manager']), EmployeesController.create as any);

// PUT /api/employees/:id - Update employee
// Require admin or manager role for updating employees
router.put('/:id', requireRole(['owner', 'admin', 'manager']), EmployeesController.update as any);

// DELETE /api/employees/:id - Delete employee
// Require admin or owner role for deleting employees
router.delete('/:id', requireRole(['owner', 'admin']), EmployeesController.delete as any);

export default router;