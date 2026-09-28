import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import { formatTimeAgo, formatDate } from '../../utils/formatters';
import EmptyState from '../../components/feedback/EmptyState';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    showToast
  } = useNotification();

  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        showToast('Notification cleared', 'info');
        refreshNotifications();
      }
    } catch (err) {
      showToast('Failed to remove notification', 'error');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational alerts, administrative actions, and security bulletins.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'Your notification box is empty'}
            description="You are completely caught up with all administrative notifications and notices."
          />
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                !notif.isRead
                  ? 'bg-white border-indigo-200/90 shadow-sm ring-1 ring-indigo-500/10'
                  : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getIcon(notif.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {notif.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      {notif.link && (
                        <Link
                          to={notif.link}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View Resource
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
