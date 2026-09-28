const Notification = require('../models/Notification');

/**
 * @desc Get user notifications and unread counter
 * @route GET /api/v1/notifications
 * @access Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch notifications targeting this user directly or sent as global broadcast
    const notifications = await Notification.find({
      $or: [{ recipient: userId }, { recipient: null }]
    })
      .sort({ createdAt: -1 })
      .limit(30);

    // Compute whether each notification is read by this user
    const formatted = notifications.map((notif) => {
      const isReadByUser = notif.recipient
        ? notif.isRead
        : notif.readBy.some((id) => String(id) === String(userId));

      return {
        ...notif.toObject(),
        isRead: isReadByUser
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: formatted,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mark a notification as read
 * @route PATCH /api/v1/notifications/:id/read
 * @access Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.recipient) {
      notification.isRead = true;
    } else {
      if (!notification.readBy.some((id) => String(id) === String(userId))) {
        notification.readBy.push(userId);
      }
    }

    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mark all notifications as read for current user
 * @route POST /api/v1/notifications/mark-all-read
 * @access Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Mark direct notifications
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Add userId to readBy in broadcast notifications
    await Notification.updateMany(
      { recipient: null, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete notification
 * @route DELETE /api/v1/notifications/:id
 * @access Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification removed'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
