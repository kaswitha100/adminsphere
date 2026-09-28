const { ROLES } = require('../config/constants');

/**
 * Middleware to enforce granular permissions on routes
 * @param {string|string[]} permissions - Required permission string or array of permissions (requires at least one)
 */
const hasPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No role or permissions found.'
      });
    }

    const userRole = req.user.role;

    // Super Admin has unrestricted operational access
    if (userRole.name === ROLES.SUPER_ADMIN) {
      return next();
    }

    const requiredList = Array.isArray(permissions) ? permissions : [permissions];
    const userPermissions = userRole.permissions || [];

    const hasAccess = requiredList.some((perm) => userPermissions.includes(perm));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not possess the required permission: [${requiredList.join(', ')}]`,
        requiredPermissions: requiredList
      });
    }

    next();
  };
};

/**
 * Middleware to enforce role names directly
 * @param {string|string[]} roles - Single role or array of allowed roles
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No role found.'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const userRoleName = req.user.role.name;

    if (userRoleName === ROLES.SUPER_ADMIN || allowedRoles.includes(userRoleName)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: This resource requires one of the following roles: [${allowedRoles.join(', ')}]`
    });
  };
};

module.exports = { hasPermission, hasRole };
