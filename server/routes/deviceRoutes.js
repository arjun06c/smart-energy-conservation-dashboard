const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, deviceController.addDevice);
router.get('/', authMiddleware, deviceController.getDevices);
router.put('/action/optimize', authMiddleware, deviceController.optimizeUsage);
router.put('/:id', authMiddleware, deviceController.updateDevice);
router.delete('/:id', authMiddleware, deviceController.deleteDevice);
router.put('/:id/toggle', authMiddleware, deviceController.toggleDevice);

module.exports = router;
