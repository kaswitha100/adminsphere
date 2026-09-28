const Notification = require('../models/Notification');

/**
 * Create a persistent notification in MongoDB
 */
const createNotification = async ({
  recipient = null,
  title,
  message,
  type = 'info',
  link = ''
}) => {
  try {
    return await Notification.create({
      recipient,
      title,
      message,
      type,
      link
    });
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
  }
};

module.exports = { createNotification };
