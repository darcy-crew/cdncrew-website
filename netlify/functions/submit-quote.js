/**
 * CDN Crew — Quote Form Handler
 *
 * Flow:
 *  1. Receive POST from contact.html
 *  2. Reject honeypot hits immediately
 *  3. Verify Cloudflare Turnstile token server-side
 *  4. Forward the submission as a plain email via Netlify's email API
 *     (falls back to a JSON response so you can see it in function logs)
 *
 * Environment variables required in Netlify dashboard:
 *   TURNSTILE_SECRET_KEY   — from dash.cloudflare.com > Turnstile > your widget
 *   NOTIFY_EMAIL           — cindy@cdncrew.com (where quote requests land)
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse form body (application/x-www-form-urlencoded)
  const params = new URLSearchParams(event.body);
  const fields = Object.fromEntries(params.entries());

  // ── 1. Honeypot check ────────────────────────────────────────────────────
  if (fields.website && fields.website.trim() !== '') {
    // Bot filled the hidden field — silently discard
    return redirect('/thank-you.html'); // looks like success to the bot
  }

  // ── 2. Turnstile verification ────────────────────────────────────────────
  const turnstileToken = fields['cf-turnstile-response'];
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (secretKey && secretKey !== 'TURNSTILE_SECRET_KEY') {
    // Turnstile is configured — enforce it
    if (!turnstileToken) {
      return errorPage('Security check missing. Please refresh and try again.');
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: turnstileToken,
        remoteip: event.headers['x-forwarded-for'] || event.headers['x-nf-client-connection-ip'],
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      console.warn('Turnstile rejected:', verifyData['error-codes']);
      return errorPage('Security check failed. Please refresh and try again.');
    }
  } else {
    // Turnstile not yet configured — log a warning and allow through
    // (remove this branch once TURNSTILE_SECRET_KEY is set in Netlify)
    console.warn('TURNSTILE_SECRET_KEY not set — skipping verification');
  }

  // ── 3. Build email body ──────────────────────────────────────────────────
  const name     = fields.name     || '(not provided)';
  const company  = fields.company  || '(not provided)';
  const email    = fields.email    || '(not provided)';
  const phone    = fields.phone    || '—';
  const type     = fields.type     || '(not provided)';
  const service  = fields.service  || '(not provided)';
  const location = fields.location || '(not provided)';
  const timeline = fields.timeline || '—';
  const details  = fields.details  || '(not provided)';

  const emailBody = `
New quote request from cdncrew.com
───────────────────────────────────

Name:     ${name}
Company:  ${company}
Email:    ${email}
Phone:    ${phone}

Type:     ${type}
Service:  ${service}
Location: ${location}
Timeline: ${timeline}

Project Details:
${details}

───────────────────────────────────
Sent via cdncrew.com/contact
  `.trim();

  // ── 4. Send email via Netlify Emails (if configured) ────────────────────
  //
  //  Netlify Emails is a paid add-on. If you haven't enabled it, the
  //  submission is logged in your function logs (Netlify dashboard > Functions)
  //  and you can also hook up a Zapier/Make webhook here.
  //
  //  To enable Netlify Emails:
  //    netlify.app/docs/platform/email-integration/
  //  Then set NETLIFY_EMAILS_SECRET in your environment variables.

  const netlifyEmailsSecret = process.env.NETLIFY_EMAILS_SECRET;
  const notifyEmail = process.env.NOTIFY_EMAIL || 'cindy@cdncrew.com';
  const siteUrl = process.env.URL || 'https://cdncrew.com';

  if (netlifyEmailsSecret) {
    try {
      const emailRes = await fetch(`${siteUrl}/.netlify/functions/emails/quote-notification`, {
        method: 'POST',
        headers: {
          'netlify-emails-secret': netlifyEmailsSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CDN Crew Website <noreply@cdncrew.com>',
          to: notifyEmail,
          subject: `New Quote Request — ${company} (${name})`,
          text: emailBody,
        }),
      });
      if (!emailRes.ok) {
        console.error('Netlify Emails send failed:', await emailRes.text());
      }
    } catch (err) {
      console.error('Email send error:', err);
    }
  } else {
    // Log to function output so you can see it in Netlify's dashboard
    // until email is wired up
    console.log('QUOTE SUBMISSION (email not configured):\n', emailBody);
  }

  // ── 5. Redirect to thank-you page ────────────────────────────────────────
  return redirect('/thank-you.html');
};

function redirect(location) {
  return {
    statusCode: 302,
    headers: { Location: location },
    body: '',
  };
}

function errorPage(message) {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'text/html' },
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error | CDN Crew</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f0}
.box{max-width:480px;padding:2.5rem;background:#fff;border-radius:8px;text-align:center}
h1{font-size:1.25rem;margin-bottom:1rem}p{color:#666;margin-bottom:1.5rem}
a{display:inline-block;padding:.75rem 1.5rem;background:#4a5c3a;color:#fff;text-decoration:none;border-radius:6px}</style>
</head><body><div class="box">
<h1>Something went wrong</h1>
<p>${message}</p>
<a href="/contact.html">&larr; Back to form</a>
</div></body></html>`,
  };
}
