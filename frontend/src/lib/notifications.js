// Simple websocket client for notifications
let ws = null;
let listeners = [];

export function connectNotifications(userId, onNotification) {
  if (ws) ws.close();
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;
  ws = new WebSocket(`${protocol}://${host}/?userId=${userId}`);
  ws.onmessage = (event) => {
    const notif = JSON.parse(event.data);
    if (onNotification) onNotification(notif);
    listeners.forEach(fn => fn(notif));
  };
  ws.onclose = () => {
    ws = null;
  };
}

export function addNotificationListener(fn) {
  listeners.push(fn);
}

export function removeNotificationListener(fn) {
  listeners = listeners.filter(l => l !== fn);
}
