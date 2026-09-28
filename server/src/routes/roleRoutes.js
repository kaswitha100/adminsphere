const express = require('express');
const router = express.Router();
const {
  getRoles,
  getPermissionsList,
  createRole,
  updateRole
} = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');

router.use(authenticate);

router.get('/', getRoles);
router.get('/permissions', hasPermission(PERMISSIONS.ROLES_MANAGE), getPermissionsList);
router.post('/', hasPermission(PERMISSIONS.ROLES_MANAGE), createRole);
router.put('/:id', hasPermission(PERMISSIONS.ROLES_MANAGE), updateRole);

module.exports = router;
