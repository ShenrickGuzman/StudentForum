export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  if (!apiKey || !secretKey) {
    console.log(`[EMAIL LOG] To: ${to} | Subject: ${subject} (Mailjet not configured)`);
    return;
  }
  const from = process.env.FROM_EMAIL || 'noreply@studentforum.com';
  const fromName = process.env.FROM_NAME || "St. Hyacinth's Forum";
  try {
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${apiKey}:${secretKey}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: from, Name: fromName },
          To: [{ Email: to }],
          Subject: subject,
          HTMLPart: html
        }]
      })
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Mailjet error (${res.status}): ${body}`);
    } else {
      console.log(`Email sent to ${to}: ${subject}`);
    }
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}
