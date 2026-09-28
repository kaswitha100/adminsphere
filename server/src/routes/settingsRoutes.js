const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings
} = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');

router.use(authenticate);

router.get('/', hasPermission(PERMISSIONS.SETTINGS_MANAGE), getSettings);
router.put('/', hasPermission(PERMISSIONS.SETTINGS_MANAGE), updateSettings);

module.exports = router;
