const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const {
  createUserValidator,
  updateUserValidator
} = require('../validators/userValidators');

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.USERS_VIEW), getUsers);
router.get('/:id', hasPermission(PERMISSIONS.USERS_VIEW), getUserById);
router.post('/', hasPermission(PERMISSIONS.USERS_CREATE), createUserValidator, createUser);
router.put('/:id', hasPermission(PERMISSIONS.USERS_UPDATE), updateUserValidator, updateUser);
router.patch('/:id/status', hasPermission(PERMISSIONS.USERS_UPDATE), toggleUserStatus);
router.delete('/:id', hasPermission(PERMISSIONS.USERS_DELETE), deleteUser);

module.exports = router;
