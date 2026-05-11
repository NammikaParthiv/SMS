import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ student: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit),
      Notification.countDocuments({ student: req.user.id, isRead: false }),
    ]);

    res.status(200).json({
      unreadCount,
      count: notifications.length,
      items: notifications,
    });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, student: req.user.id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.status(200).json({ msg: "Notification marked as read", notification });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const deleteMyNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findOneAndDelete({ _id: id, student: req.user.id });

    if (!deleted) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.status(200).json({ msg: "Notification deleted" });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};
