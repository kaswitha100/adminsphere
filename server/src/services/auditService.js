const AuditLog = require('../models/AuditLog');

/**
 * Log administrative or system activity
 */
const logAudit = async ({
  req,
  actor,
  action,
  resource,
  resourceId,
  details,
  metadata = {}
}) => {
  try {
    let actorData = {
      id: null,
      name: 'System',
      email: 'system@adminsphere.local',
      role: 'System'
    };

    if (actor) {
      actorData = {
        id: actor._id || actor.id,
        name: actor.name || 'User',
        email: actor.email,
        role: actor.role?.name || actor.roleName || (typeof actor.role === 'string' ? actor.role : 'User')
      };
    } else if (req && req.user) {
      actorData = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role?.name || 'User'
      };
    }

    const ipAddress =
      req?.headers['x-forwarded-for'] ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      actor: actorData,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : undefined,
      details,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
      metadata
    });
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error.message);
  }
};

module.exports = { logAudit };
