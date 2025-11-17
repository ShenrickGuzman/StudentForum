// Simple websocket server for notifications
import { WebSocketServer } from 'ws';

// Export a function to attach websocket to an existing HTTP server
export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  // Map userId to websocket
  const clients = new Map();

  wss.on('connection', (ws, req) => {
    // Expect userId as a query param (e.g., ws://host?userId=123)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    if (userId) {
      clients.set(userId, ws);
      ws.on('close', () => clients.delete(userId));
    }
    ws.on('message', (msg) => {
      // Optionally handle incoming messages from client
    });
  });

  // Function to send notification to a user
  function sendNotification(userId, notification) {
    const ws = clients.get(String(userId));
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(notification));
    }
  }

  // Expose broadcast function
  wss.sendNotification = sendNotification;
  return wss;
}
