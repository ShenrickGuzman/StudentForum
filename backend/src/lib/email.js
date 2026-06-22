import nodemailer from 'nodemailer';
import dns from 'dns/promises';

let transporter = null;
let cachedHost = null;

async function resolveHost(hostname) {
  if (cachedHost) return cachedHost;
  try {
    // Try IPv4 first (Render doesn't support outbound IPv6)
    const v4 = await dns.resolve4(hostname);
    if (v4 && v4.length > 0) {
      cachedHost = v4[0];
      return cachedHost;
    }
  } catch {}
  cachedHost = hostname;
  return cachedHost;
}

async function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured — emails will be logged but not sent');
    return null;
  }
  const ip = await resolveHost(SMTP_HOST);
  const port = parseInt(SMTP_PORT || '465', 10);
  transporter = nodemailer.createTransport({
    host: ip,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@studentforum.com';
  const fromName = process.env.FROM_NAME || "St. Hyacinth's Forum";
  const t = await getTransporter();
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
