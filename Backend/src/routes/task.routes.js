const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller.js');

router.post('/', taskController.createTask);
router.get('/:userId', taskController.getTasksByUser);
router.put('/:id', taskController.updateTask); // Cập nhật
router.delete('/:id', taskController.deleteTask); // Xóa

module.exports = router;