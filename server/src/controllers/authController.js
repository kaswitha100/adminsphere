const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AUDIT_ACTIONS } = require('../config/constants');
const { logAudit } = require('../services/auditService');

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role?.name || 'User'
    },
    process.env.JWT_SECRET || 'adminsphere_default_secret_key_change_in_production',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

/**
 * @desc Authenticate user and issue JWT
 * @route POST /api/v1/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email: rawEmail, password } = req.body;
    const cleanInput = (rawEmail || '').trim().toLowerCase();

    // Support superadminsphere.io, superadmin, or standard corporate emails
    let lookupEmail = cleanInput;
    if (cleanInput === 'superadminsphere.io' || cleanInput === 'superadmin') {
      lookupEmail = 'superadmin@adminsphere.io';
    } else if (cleanInput === 'adminsphere.io' || cleanInput === 'admin') {
      lookupEmail = 'admin@adminsphere.io';
    }

    // Search user with password field explicitly selected
    const user = await User.findOne({
      $or: [
        { email: cleanInput },
        { email: lookupEmail }
      ]
    }).select('+password').populate('role');

    if (!user) {
      await logAudit({
        req,
        actor: { email: rawEmail },
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        resource: 'Auth',
        details: `Failed sign-in attempt for non-existent account: ${rawEmail}`
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAudit({
        req,
        actor: { id: user._id, name: user.name, email: user.email, role: user.role?.name },
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        resource: 'Auth',
        details: `Incorrect password entered for: ${rawEmail}`
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact organization administration.'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator to reactivate.'
      });
    }

    // Update timestamps
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    await user.save();

    const token = generateToken(user);

    // Audit log
    await logAudit({
      req,
      actor: user,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      resource: 'Auth',
      resourceId: user._id,
      details: `User ${user.email} signed in successfully`
    });

    res.status(200).json({
      success: true,
      message: 'Sign in successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
        avatar: user.avatar,
        phone: user.phone,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get current signed in user details
 * @route GET /api/v1/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Sign out current session
 * @route POST /api/v1/auth/logout
 * @access Private
 */
const logout = async (req, res, next) => {
  try {
    await logAudit({
      req,
      actor: req.user,
      action: AUDIT_ACTIONS.LOGOUT,
      resource: 'Auth',
      resourceId: req.user._id,
      details: `User ${req.user.email} signed out`
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  logout
};
