const User = require('../models/User');
const { AUDIT_ACTIONS } = require('../config/constants');
const { logAudit } = require('../services/auditService');

/**
 * @desc Get authenticated user profile
 * @route GET /api/v1/profile
 * @access Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update user profile metadata
 * @route PUT /api/v1/profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const { name, phone, department, avatar } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const updatedUser = await User.findById(user._id).populate('role');

    await logAudit({
      req,
      action: AUDIT_ACTIONS.PROFILE_UPDATED,
      resource: 'User',
      resourceId: user._id,
      details: `${user.email} updated personal profile information`
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Change user password
 * @route POST /api/v1/profile/change-password
 * @access Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to current password'
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      req,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      resource: 'User',
      resourceId: user._id,
      details: `${user.email} changed their password`
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
