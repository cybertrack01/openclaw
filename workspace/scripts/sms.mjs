#!/usr/bin/env node
/**
 * Twilio SMS CLI — Poppy's inbound/outbound SMS access
 *
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_NUMBER (or TWILIO_WHATSAPP_NUMBER)
 *
 * Usage:
 *   sms.mjs send --to +61412345678 --body "Hello!"
 *   sms.mjs inbox                         List recent incoming messages
 *   sms.mjs thread +61412345678           Full conversation with one number
 *   sms.mjs read <messageSid>             One message by SID
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM        = process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER;

if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM) {
  console.error(JSON.stringify({ error: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_NUMBER must be set' }));
  process.exit(1);
}

const BASE = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}`;
const AUTH = 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { Authorization: AUTH } };
  if (body) {
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    opts.body = new URLSearchParams(body).toString();
  }
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Twilio API error ${res.status}`);
  return data;
}

function fmtMsg(m) {
  return {
    sid:       m.sid,
    direction: m.direction,   // inbound | outbound-api
    from:      m.from,
    to:        m.to,
    body:      m.body,
    status:    m.status,
    date:      m.date_sent,
  };
}

const [,, cmd, ...args] = process.argv;
const get = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };

try {
  // ── send ────────────────────────────────────────────────────
  if (cmd === 'send') {
    const to   = get('--to');
    const body = get('--body');
    if (!to || !body) {
      console.error(JSON.stringify({ error: 'Usage: sms.mjs send --to <number> --body <text>' }));
      process.exit(1);
    }
    const result = await api('/Messages.json', 'POST', { From: FROM, To: to, Body: body });
    console.log(JSON.stringify({ success: true, sid: result.sid, to: result.to, status: result.status }, null, 2));

  // ── inbox ───────────────────────────────────────────────────
  } else if (cmd === 'inbox') {
    // All inbound messages to our number, most recent first
    const params = new URLSearchParams({ To: FROM, PageSize: '20' });
    const result = await api(`/Messages.json?${params}`);
    const messages = (result.messages || []).map(fmtMsg);
    console.log(JSON.stringify({ messages, count: messages.length }, null, 2));

  // ── thread ──────────────────────────────────────────────────
  } else if (cmd === 'thread' && args[0]) {
    const number = args[0];
    // Fetch both directions and merge
    const [inbound, outbound] = await Promise.all([
      api(`/Messages.json?${new URLSearchParams({ From: number, To: FROM, PageSize: '50' })}`),
      api(`/Messages.json?${new URLSearchParams({ From: FROM, To: number, PageSize: '50' })}`),
    ]);
    const all = [
      ...(inbound.messages  || []),
      ...(outbound.messages || []),
    ].sort((a, b) => new Date(a.date_sent) - new Date(b.date_sent));

    console.log(JSON.stringify({ thread: all.map(fmtMsg), count: all.length }, null, 2));

  // ── read ────────────────────────────────────────────────────
  } else if (cmd === 'read' && args[0]) {
    const result = await api(`/Messages/${args[0]}.json`);
    console.log(JSON.stringify(fmtMsg(result), null, 2));

  } else {
    console.log(JSON.stringify({
      from: FROM,
      usage: [
        'sms.mjs send --to <number> --body <text>   Send an SMS',
        'sms.mjs inbox                               List recent incoming messages',
        'sms.mjs thread <number>                     Full conversation with one number',
        'sms.mjs read <messageSid>                   One message by SID',
      ],
    }));
    process.exit(1);
  }
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
