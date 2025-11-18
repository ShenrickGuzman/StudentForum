// Helper to send notifications via websocket and save to DB
import { supabase } from './supabaseClient.js';
import { sendNotification as sendWsNotification } from '../../websocket.js';

export async function notifyUser(userId, { type, message, link }) {
  // Save notification to DB (don't let DB failure block caller)
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      message,
      link,
      read: false
    });
  } catch (dbErr) {
    console.error('Failed to save notification to DB:', dbErr);
  }

  // Send via websocket, but don't throw if it fails
  try {
    sendWsNotification(userId, { type, message, link });
  } catch (wsErr) {
    console.error('Failed to send websocket notification:', wsErr);
  }
}
