// src/routes/project.routes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');

router.post('/', projectController.createProject);
router.get('/:userId', projectController.getProjectsByUser);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;