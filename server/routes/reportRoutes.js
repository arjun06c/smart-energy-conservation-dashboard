const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/dashboard', reportController.getDashboardData);
router.get('/history', reportController.getUsageHistory);
router.get('/history/day/:date', reportController.getDayReport);
router.get('/export/csv', reportController.exportCSV);
router.get('/export/pdf', reportController.exportPDF);

module.exports = router;
