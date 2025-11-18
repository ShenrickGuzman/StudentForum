// Simple websocket server for notifications
import { WebSocketServer } from 'ws';

// Module-level instance and clients map so other modules can send notifications
let wssInstance = null;
const clients = new Map();

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  wssInstance = wss;

  wss.on('connection', (ws, req) => {
    // Expect userId as a query param (e.g., ws://host?userId=123)
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');
      if (userId) {
        clients.set(String(userId), ws);
        ws.on('close', () => clients.delete(String(userId)));
      }
    } catch (e) {
      // Ignore malformed URL or missing host
    }
    ws.on('message', (msg) => {
      // Optionally handle incoming messages from client
    });
  });

  // Function to send notification to a user
  function sendNotification(userId, notification) {
    const ws = clients.get(String(userId));
    if (ws && ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(notification));
      } catch (e) {
        // ignore send errors
      }
    }
  }

  // Expose broadcast function on instance for compatibility
  wss.sendNotification = sendNotification;
  return wss;
}

// Allow other modules to send notifications without importing server.js
export function sendNotification(userId, notification) {
  if (wssInstance && typeof wssInstance.sendNotification === 'function') {
    try {
      wssInstance.sendNotification(userId, notification);
      return true;
    } catch (e) {
      return false;
    }
  }
  // Fallback: try to send directly using clients map
  const ws = clients.get(String(userId));
  if (ws && ws.readyState === ws.OPEN) {
    try {
      ws.send(JSON.stringify(notification));
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}
