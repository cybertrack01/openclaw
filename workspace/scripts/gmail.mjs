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
  let body = '';
  const extract = parts => { for (const p of parts || []) {
    if (p.mimeType === 'text/plain' && p.body?.data) body += Buffer.from(p.body.data, 'base64').toString();
    if (p.parts) extract(p.parts);
  }};
  if (d.payload?.body?.data) body = Buffer.from(d.payload.body.data, 'base64').toString();
  extract(d.payload?.parts);
  const h = Object.fromEntries((d.payload?.headers || []).map(x => [x.name, x.value]));
  console.log(JSON.stringify({ id: d.id, from: h.From, to: h.To, subject: h.Subject, date: h.Date, body: body.slice(0, 8000) }, null, 2));

} else if (cmd === 'send') {
  const token = await getToken();
  const get = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : null; };
  const to = get('--to'), subject = get('--subject'), body = get('--body');
  const raw = Buffer.from(
    `From: Poppy at WOOOF Dog Grooming <${IMPERSONATE}>\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`
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
