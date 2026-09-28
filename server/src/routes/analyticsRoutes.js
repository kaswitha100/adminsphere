const express = require('express');
const router = express.Router();
const { getAnalyticsOverview } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');

router.use(authenticate);
router.get('/', hasPermission(PERMISSIONS.REPORTS_VIEW), getAnalyticsOverview);

module.exports = router;
