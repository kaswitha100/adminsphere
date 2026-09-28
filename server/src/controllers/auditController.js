const AuditLog = require('../models/AuditLog');

/**
 * @desc Get paginated audit logs with search, action, user, and date filtering
 * @route GET /api/v1/audit
 * @access Private (audit.view)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { search, action, actorEmail, startDate, endDate } = req.query;

    const query = {};

    // Search query
    if (search && search.trim() !== '') {
      const term = search.trim();
      query.$or = [
        { details: { $regex: term, $options: 'i' } },
        { resource: { $regex: term, $options: 'i' } },
        { 'actor.name': { $regex: term, $options: 'i' } },
        { 'actor.email': { $regex: term, $options: 'i' } }
      ];
    }

    // Action filter
    if (action && action !== 'all') {
      query.action = action;
    }

    // Actor Email filter
    if (actorEmail && actorEmail !== 'all') {
      query['actor.email'] = { $regex: actorEmail.trim(), $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Retrieve unique actions for the filter select dropdown
    const availableActions = await AuditLog.distinct('action');

    res.status(200).json({
      success: true,
      data: logs,
      availableActions,
      pagination: {
        totalLogs,
        totalPages: Math.ceil(totalLogs / limit) || 1,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
