import React, { useEffect, useState } from 'react';
import { connectNotifications } from '../lib/notifications';
import { getNotifications, clearNotifications, markNotificationsRead } from '../lib/api';
import { useAuth } from '../state/auth';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const handleClearNotifications = async () => {
    if (user?.id) {
      try {
        await clearNotifications();
        setNotifications([]);
        setUnread(0);
      } catch {}
    }
  };

  useEffect(() => {
    if (user?.id) {
      getNotifications()
        .then(res => {
          if (res?.data?.notifications) {
            setNotifications(res.data.notifications);
            setUnread(res.data.notifications.filter(n => !n.read).length);
          }
        })
        .catch(() => {});
      connectNotifications(user.id, notif => {
        setNotifications(prev => [notif, ...prev]);
        setUnread(u => u + 1);
      });
    }
  }, [user?.id]);

  const handleBellClick = async () => {
    setDropdownOpen(d => !d);
    setUnread(0);
    if (user?.id) {
      try {
        await markNotificationsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch {}
    }
  };

  return (
    <div className="relative inline-block">
      <button onClick={handleBellClick} className="relative bg-none border-none cursor-pointer p-2" aria-label="Notifications">
        <span className="text-[28px] leading-none">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">{unread}</span>
        )}
      </button>
      {dropdownOpen && (
        <div className="notification-dropdown-mobile absolute right-0 top-[110%] min-w-[260px] bg-white border border-gray-100 rounded-xl shadow-lg z-[100]">
          <div className="flex items-center justify-between px-4 py-2.5 font-bold text-sm border-b border-gray-100">
            <span className="text-dark">Notifications</span>
            <button onClick={handleClearNotifications} className="bg-none border-none text-secondary font-bold cursor-pointer text-xs" title="Clear all notifications">Clear</button>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted">No notifications yet.</div>
          ) : (
            notifications.slice(0, 8).map((n, i) => (
              <a
                key={i}
                href={n.link || '#'}
                className="block px-4 py-2.5 text-sm text-dark no-underline border-b border-gray-50 hover:bg-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <span className="mr-1.5">{n.type === 'comment' ? '💬' : n.type === 'reaction' ? '😃' : n.type === 'new_post' ? '📝' : '🔔'}</span>
                {n.message}
              </a>
            ))
          )}
          <style>{`
            @media (max-width: 600px) {
              .notification-dropdown-mobile {
                left: 50% !important;
                right: auto !important;
                transform: translateX(-50%) !important;
                min-width: 90vw !important;
                max-width: 98vw !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
