// Helper to send notifications via websocket and save to DB
import { supabase } from './supabaseClient.js';
import { wss } from '../../server.js';

export async function notifyUser(userId, { type, message, link }) {
  // Save notification to DB
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    message,
    link,
    read: false
  });
  // Send via websocket
  if (wss && wss.sendNotification) {
    wss.sendNotification(userId, { type, message, link });
  }
}
