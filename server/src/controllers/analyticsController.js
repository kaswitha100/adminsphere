const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

/**
 * @desc Get deep analytics, time-series metrics, and organizational reports
 * @route GET /api/v1/analytics
 * @access Private (reports.view)
 */
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Monthly Registration Velocity (12 Months)
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const registrationTrend = monthlyRegistrations.map((m) => ({
      period: `${months[m._id.month - 1]} ${m._id.year}`,
      users: m.count
    }));

    // 2. Department Breakdown
    const departmentBreakdown = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          department: { $ifNull: ['$_id', 'General'] },
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 3. Administrative Activity Heatmap / Categorization
    const activityCategories = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          action: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // 4. Daily Login Volume (Past 14 Days)
    const dailyLogins = await AuditLog.aggregate([
      {
        $match: {
          action: 'LOGIN_SUCCESS',
          createdAt: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%m/%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 5. Total Metrics Snapshot
    const [totalUsers, activeUsers, totalRoles, totalAudits] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Role.countDocuments(),
      AuditLog.countDocuments()
    ]);

    const activeRatio = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          activeRatio,
          totalRoles,
          totalAudits
        },
        registrationTrend,
        departmentBreakdown,
        activityCategories,
        dailyLogins
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsOverview
};
