#!/usr/bin/env node
// Poppy Gmail CLI — uses GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_IMPERSONATE_EMAIL

import { createSign } from 'crypto';

const SA = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
const IMPERSONATE = process.env.GOOGLE_IMPERSONATE_EMAIL || 'poppy@wooof.com.au';
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const hdr = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const pay = Buffer.from(JSON.stringify({
    iss: SA.client_email, sub: IMPERSONATE,
    scope: SCOPES.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${hdr}.${pay}`);
  const sig = sign.sign(SA.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${hdr}.${pay}.${sig}`
  });
  return (await res.json()).access_token;
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

if (cmd === 'list') {
  const token = await getToken();
  const q = args[0] || 'in:inbox';
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const msgs = (data.messages || []).slice(0, 10);
  const details = await Promise.all(msgs.map(async m => {
    const r = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = await r.json();
    const h = Object.fromEntries((d.payload?.headers || []).map(x => [x.name, x.value]));
    return { id: d.id, from: h.From, subject: h.Subject, date: h.Date, snippet: d.snippet };
  }));
  console.log(JSON.stringify(details, null, 2));

} else if (cmd === 'read') {
  const token = await getToken();
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${args[0]}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await res.json();

  let plainBody = '';
  let htmlBody = '';

  // Recursively walk all MIME parts collecting text/plain and text/html
  const extract = parts => {
    for (const p of parts || []) {
      if (p.mimeType === 'text/plain' && p.body?.data) {
        plainBody += Buffer.from(p.body.data, 'base64url').toString();
      } else if (p.mimeType === 'text/html' && p.body?.data) {
        htmlBody += Buffer.from(p.body.data, 'base64url').toString();
      }
      if (p.parts) extract(p.parts);
    }
  };

  // Handle single-part (non-multipart) messages
  if (d.payload?.body?.data) {
    const decoded = Buffer.from(d.payload.body.data, 'base64url').toString();
    if (d.payload.mimeType === 'text/html') htmlBody = decoded;
    else plainBody = decoded;
  }
  extract(d.payload?.parts);

  // Extract all http(s) links from HTML — critical for finding Seek application URLs
  const links = [];
  const seen = new Set();
  for (const m of htmlBody.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (href.startsWith('http') && !seen.has(href)) {
      seen.add(href);
      links.push(href);
    }
  }
  // Also catch bare URLs in plain text
  for (const m of plainBody.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
    if (!seen.has(m[0])) { seen.add(m[0]); links.push(m[0]); }
  }

  // Strip HTML tags for readable fallback body
  const strippedHtml = htmlBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '
')
    .replace(/<\/?(p|div|tr|li|h[1-6])[^>]*>/gi, '
')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/
{3,}/g, '

')
    .trim();

  const body = plainBody.trim() || strippedHtml;

  const h = Object.fromEntries((d.payload?.headers || []).map(x => [x.name, x.value]));
  console.log(JSON.stringify({
    id: d.id,
    from: h.From,
    to: h.To,
    subject: h.Subject,
    date: h.Date,
    body,
    links,
  }, null, 2));

} else if (cmd === 'send') {
  const token = await getToken();
  const get = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : null; };
  const to = get('--to'), subject = get('--subject'), body = get('--body');
  const raw = Buffer.from(
    `From: Poppy at WOOOF Dog Grooming <${IMPERSONATE}>
To: ${to}
Subject: ${subject}
Content-Type: text/plain; charset=utf-8

${body}`
  ).toString('base64url');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  });
  const d = await res.json();
  console.log(JSON.stringify({ success: !!d.id, messageId: d.id }));

} else {
  console.error('Usage: gmail.mjs <list [query]|read <id>|send --to <> --subject <> --body <>');
  process.exit(1);
}
