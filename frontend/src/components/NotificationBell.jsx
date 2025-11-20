import React, { useEffect, useState } from 'react';
import { connectNotifications } from '../lib/notifications';
import { getNotifications } from '../lib/api';
import { clearNotifications } from '../lib/api';
import { markNotificationsRead } from '../lib/api';
import { useAuth } from '../state/auth';

export default function NotificationBell() {
    const handleClearNotifications = async () => {
      if (user?.id) {
        try {
          await clearNotifications();
          setNotifications([]);
          setUnread(0);
        } catch {}
      }
    };
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user?.id) {
      // Fetch persistent notifications on mount/login
      getNotifications()
        .then(res => {
          if (res?.data?.notifications) {
            setNotifications(res.data.notifications);
            // Count unread notifications
            setUnread(res.data.notifications.filter(n => !n.read).length);
          }
        })
        .catch(() => {});
      // Setup real-time notifications
      connectNotifications(user.id, notif => {
        setNotifications(prev => [notif, ...prev]);
        setUnread(u => u + 1);
      });
    }
  }, [user?.id]);

  const handleBellClick = async () => {
    setDropdownOpen(d => !d);
    setUnread(0);
    // Mark notifications as read in backend
    if (user?.id) {
      try {
        await markNotificationsRead();
        // Optionally update local notifications state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch {}
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleBellClick}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
        aria-label="Notifications"
      >
        <span style={{ fontSize: 28 }}>🔔</span>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: '#ff4081', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: 12, fontWeight: 'bold' }}>{unread}</span>
        )}
      </button>
      {dropdownOpen && (
        <div
          className="notification-dropdown-mobile"
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            minWidth: 260,
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            zIndex: 100,
            left: undefined,
            transform: undefined,
          }}
        >
          <div style={{ padding: '10px 16px', fontWeight: 'bold', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Notifications</span>
            <button
              onClick={handleClearNotifications}
              style={{ background: 'none', border: 'none', color: '#ff4081', fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
              title="Clear all notifications"
            >
              Clear
            </button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '16px', color: '#888' }}>No notifications yet.</div>
          ) : (
            notifications.slice(0, 8).map((n, i) => (
              <a
                key={i}
                href={n.link || '#'}
                style={{ display: 'block', padding: '10px 16px', color: '#333', textDecoration: 'none', borderBottom: '1px solid #f5f5f5', fontSize: 15 }}
                onClick={() => setDropdownOpen(false)}
              >
                <span style={{ marginRight: 8 }}>{n.type === 'comment' ? '💬' : n.type === 'reaction' ? '😃' : n.type === 'new_post' ? '📝' : '🔔'}</span>
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
