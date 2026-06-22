export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL LOG] To: ${to} | Subject: ${subject} (SendGrid not configured)`);
    return;
  }
  const from = process.env.FROM_EMAIL || 'noreply@studentforum.com';
  const fromName = process.env.FROM_NAME || "St. Hyacinth's Forum";
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: fromName },
        subject,
        content: [{ type: 'text/html', value: html }]
      })
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`SendGrid error (${res.status}): ${body}`);
    } else {
      console.log(`Email sent to ${to}: ${subject}`);
    }
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}
