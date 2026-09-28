const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

/**
 * @desc Get real-time dashboard KPIs, aggregates, and activity feeds
 * @route GET /api/v1/dashboard/stats
 * @access Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. User Summary Counters
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      newUsersPastMonth,
      totalRoles,
      totalAuditLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Role.countDocuments(),
      AuditLog.countDocuments()
    ]);

    // 2. Role Distribution
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: '_id',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: {
          path: '$roleInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: { $ifNull: ['$roleInfo.name', 'Unassigned'] },
          count: 1
        }
      }
    ]);

    // 3. User Growth (Past 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const growthStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
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

    // Format month names for user growth
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedGrowth = growthStats.map((item) => ({
      period: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      newUsers: item.count
    }));

    // 4. Status Breakdown
    const statusDistribution = [
      { name: 'Active', value: activeUsers, color: '#10B981' },
      { name: 'Inactive', value: inactiveUsers, color: '#94A3B8' },
      { name: 'Suspended', value: suspendedUsers, color: '#EF4444' }
    ];

    // 5. Recent System Activities
    const recentActivities = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(7);

    // 6. Recent Logins
    const recentLogins = await AuditLog.find({
      action: { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] }
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Login Activity (Past 7 Days)
    const loginTrend = await AuditLog.aggregate([
      {
        $match: {
          action: 'LOGIN_SUCCESS',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          logins: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          inactiveUsers: inactiveUsers + suspendedUsers,
          newUsers: newUsersPastMonth,
          totalRoles,
          totalAuditLogs
        },
        roleDistribution: roleStats,
        statusDistribution,
        growth: formattedGrowth,
        loginTrend,
        recentActivities,
        recentLogins
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
