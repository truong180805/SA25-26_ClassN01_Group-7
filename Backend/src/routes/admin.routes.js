const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { isAdmin } = require('../middlewares/admin.middleware');

// ÁP DỤNG MIDDLEWARE BẢO VỆ CHO TOÀN BỘ ROUTE ADMIN
router.use(isAdmin); 

router.get('/stats', adminController.getSystemStats);
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/health', adminController.getSystemHealth);
router.get('/backup', adminController.exportBackup);

module.exports = router;