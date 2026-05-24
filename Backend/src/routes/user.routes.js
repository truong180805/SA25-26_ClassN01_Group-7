const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller'); 

router.post('/', userController.createUser);
router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);
router.put('/:id/password', userController.changePassword);

module.exports = router;