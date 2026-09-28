const SystemSetting = require('../models/SystemSetting');
const { AUDIT_ACTIONS } = require('../config/constants');
const { logAudit } = require('../services/auditService');

/**
 * @desc Get all organization system settings grouped by category
 * @route GET /api/v1/settings
 * @access Private (settings.manage)
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();

    const grouped = {
      general: {},
      security: {},
      notifications: {}
    };

    settings.forEach((item) => {
      if (grouped[item.category]) {
        grouped[item.category][item.key] = item.value;
      }
    });

    res.status(200).json({
      success: true,
      data: grouped,
      raw: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update system settings
 * @route PUT /api/v1/settings
 * @access Private (settings.manage)
 */
const updateSettings = async (req, res, next) => {
  try {
    const { category, settings } = req.body;

    if (!category || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Category and settings object are required'
      });
    }

    const updatedKeys = [];

    for (const [key, value] of Object.entries(settings)) {
      await SystemSetting.findOneAndUpdate(
        { key, category },
        {
          value,
          updatedBy: req.user._id,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      updatedKeys.push(key);
    }

    await logAudit({
      req,
      action: AUDIT_ACTIONS.SETTINGS_UPDATED,
      resource: 'SystemSetting',
      details: `Updated [${category}] settings: ${updatedKeys.join(', ')}`,
      metadata: { category, keys: updatedKeys }
    });

    res.status(200).json({
      success: true,
      message: `${category.charAt(0).toUpperCase() + category.slice(1)} settings updated successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
