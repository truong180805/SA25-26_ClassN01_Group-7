const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');

router.post('/', taskController.createTask);
router.get('/project/:projectId', taskController.getTasksByProject);
router.put('/:id', taskController.updateTask); // Cập nhật
router.delete('/:id', taskController.deleteTask); // Xóa

module.exports = router;