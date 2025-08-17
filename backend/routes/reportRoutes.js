import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// Generate monthly financial report
router.get('/monthly/:month/:year', ReportController.generateMonthlyReport);

// Export monthly report to Excel
router.get('/monthly/:month/:year/export', ReportController.exportMonthlyReport);

// Get all monthly balances
router.get('/balances', ReportController.getAllMonthlyBalances);

// Get yearly summary
router.get('/yearly/:year', ReportController.getYearlySummary);

export default router;
