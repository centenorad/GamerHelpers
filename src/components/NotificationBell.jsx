import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  MessageCircle,
  FileCheck,
  DollarSign,
  Star,
  Briefcase,
} from "lucide-react";
import { NotificationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const notificationIcons = {
  new_request: MessageCircle,
  request_accepted: Check,
  request_rejected: X,
  user_confirmed: CheckCheck,
  service_started: Briefcase,
  chat_message: MessageCircle,
  completion_requested: FileCheck,
  service_completed: Check,
  service_reopened: Briefcase,
  payment_received: DollarSign,
  review_received: Star,
  application_approved: Check,
  application_rejected: X,
  application_pending_reapproval: FileCheck,
};

const notificationColors = {
  new_request: "text-blue-400",
  request_accepted: "text-green-400",
  request_rejected: "text-red-400",
  user_confirmed: "text-green-400",
  service_started: "text-purple-400",
  chat_message: "text-blue-400",
  completion_requested: "text-yellow-400",
  service_completed: "text-green-400",
  service_reopened: "text-yellow-400",
  payment_received: "text-green-400",
  review_received: "text-yellow-400",
  application_approved: "text-green-400",
  application_rejected: "text-red-400",
  application_pending_reapproval: "text-yellow-400",
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await NotificationsAPI.getUnreadCount();
        setUnreadCount(res.count);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await NotificationsAPI.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await NotificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg hover:bg-ghforegroundlow/10 transition-all"
      >
        <Bell
          size={22}
          className="text-ghforegroundlow hover:text-white transition-colors"
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 animate-bounce-subtle">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[70vh] bg-ghbackground-secondary border border-ghforegroundlow/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-ghforegroundlow/20 bg-ghbackground">
            <h3 className="text-lg font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-ghaccent hover:text-ghaccent-hover transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="p-8 text-center text-ghforegroundlow">
                <div className="animate-spin w-6 h-6 border-2 border-ghaccent border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-ghforegroundlow">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon =
                  notificationIcons[notification.notification_type] || Bell;
                const colorClass =
                  notificationColors[notification.notification_type] ||
                  "text-ghforegroundlow";

                return (
                  <div
                    key={notification.id}
                    onClick={() =>
                      !notification.is_read && handleMarkAsRead(notification.id)
                    }
                    className={`p-4 border-b border-ghforegroundlow/10 cursor-pointer transition-all hover:bg-ghforegroundlow/5 ${
                      !notification.is_read ? "bg-ghaccent/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`p-2 rounded-lg bg-ghbackground ${colorClass}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`font-semibold text-sm ${notification.is_read ? "text-ghforegroundlow" : "text-white"}`}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-ghaccent flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-sm text-ghforegroundlow mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-ghforegroundlow/60 mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
