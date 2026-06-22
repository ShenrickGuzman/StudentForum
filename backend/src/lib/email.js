import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 — Render doesn't support outbound IPv6
const lookup = (hostname, cb) => dns.lookup(hostname, { family: 4, all: false }, cb);

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured — emails will be logged but not sent');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    lookup
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@studentforum.com';
  const fromName = process.env.FROM_NAME || "St. Hyacinth's Forum";
  const t = getTransporter();
  if (!t) {
    console.log(`[EMAIL LOG] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await t.sendMail({ from: `"${fromName}" <${from}>`, to, subject, html });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}
