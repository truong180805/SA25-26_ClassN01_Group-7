// Tạo thêm 1 file: src/routes/workspace.routes.js
const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');

router.post('/', workspaceController.createWorkspace);
router.get('/user/:userId', workspaceController.getUserWorkspaces);
router.delete('/:id', workspaceController.deleteWorkspace);

module.exports = router;
