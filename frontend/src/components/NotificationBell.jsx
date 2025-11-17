import React, { useEffect, useState } from 'react';
import { connectNotifications } from '../lib/notifications';
import { useAuth } from '../state/auth';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user?.id) {
      connectNotifications(user.id, notif => {
        setNotifications(prev => [notif, ...prev]);
        setUnread(u => u + 1);
      });
    }
  }, [user?.id]);

  const handleBellClick = () => {
    setDropdownOpen(d => !d);
    setUnread(0);
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
        <div style={{ position: 'absolute', right: 0, top: '110%', minWidth: 260, background: '#fff', border: '1px solid #eee', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 100 }}>
          <div style={{ padding: '10px 16px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Notifications</div>
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
        </div>
      )}
    </div>
  );
}
