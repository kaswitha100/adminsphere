const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');

router.use(authenticate);
router.get('/', hasPermission(PERMISSIONS.AUDIT_VIEW), getAuditLogs);

module.exports = router;
