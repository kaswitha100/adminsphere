const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'adminsphere_default_secret_key_change_in_production'
    );

    const user = await User.findById(decoded.id).populate('role');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account associated with token no longer exists.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact your organization administrator.'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact an administrator to reactivate.'
      });
    }

    // Non-blocking update to lastActivity
    User.findByIdAndUpdate(user._id, { lastActivity: new Date() }).exec().catch(() => {});

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session token has expired. Please sign in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

module.exports = { authenticate };
