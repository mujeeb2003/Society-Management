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

// Generate villa-wise annual report
router.get('/villa/:villaId', ReportController.generateVillaReport);

// Export villa-wise report to Excel
router.get('/villa/:villaId/export', ReportController.exportVillaReport);

// Generate pending payments report
router.get('/pending', ReportController.generatePendingPaymentsReport);

// Export pending payments report to Excel
router.get('/pending/export', ReportController.exportPendingPaymentsReport);

export default router;
