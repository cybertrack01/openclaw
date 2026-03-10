#!/usr/bin/env node
/**
 * Indeed API CLI — Disposition Sync and application data
 *
 * Uses Indeed's OAuth 2-legged client credentials + GraphQL API.
 *
 * Usage:
 *   indeed.mjs update-status <applicationId> <jobId> <status> [note]
 *     Update a candidate's disposition in Indeed (keeps their matching algo informed).
 *
 *   indeed.mjs parse-webhook <jsonFile>
 *     Parse an Indeed Apply webhook payload JSON file and output structured candidate data.
 *
 *   indeed.mjs get-token
 *     Verify credentials by fetching an OAuth token (diagnostic only).
 *
 * Env: INDEED_CLIENT_ID, INDEED_CLIENT_SECRET, INDEED_ATS_IDENTIFIER
 *
 * Valid status values:
 *   APPLICATION_RECEIVED | VIEWED | CONTACTED | INTERVIEW_SCHEDULED |
 *   OFFER_MADE | HIRED | NOT_SELECTED | WITHDRAWN
 */

import { readFileSync } from 'fs';

const INDEED_TOKEN_URL = 'https://apis.indeed.com/oauth/v2/tokens';
const INDEED_GRAPHQL_URL = 'https://apis.indeed.com/graphql';

const CLIENT_ID = process.env.INDEED_CLIENT_ID;
const CLIENT_SECRET = process.env.INDEED_CLIENT_SECRET;
const ATS_IDENTIFIER = process.env.INDEED_ATS_IDENTIFIER;

const [,, cmd, ...args] = process.argv;

const VALID_STATUSES = [
  'APPLICATION_RECEIVED',
  'VIEWED',
  'CONTACTED',
  'INTERVIEW_SCHEDULED',
  'OFFER_MADE',
  'HIRED',
  'NOT_SELECTED',
  'WITHDRAWN',
];

// ── OAuth token ───────────────────────────────────────────────
let _tokenCache = null;

async function getAccessToken() {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 60_000) {
    return _tokenCache.accessToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('INDEED_CLIENT_ID and INDEED_CLIENT_SECRET env vars must be set');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(INDEED_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Indeed OAuth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  _tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return _tokenCache.accessToken;
}

// ── GraphQL helper ────────────────────────────────────────────
async function graphql(query, variables) {
  const token = await getAccessToken();

  const res = await fetch(INDEED_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Indeed GraphQL request failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Indeed GraphQL errors: ${json.errors.map(e => e.message).join('; ')}`);
  }
  return json.data;
}

// ── update-status ─────────────────────────────────────────────
async function updateStatus(applicationId, jobId, status, note) {
  if (!ATS_IDENTIFIER) {
    throw new Error('INDEED_ATS_IDENTIFIER env var must be set');
  }

  if (!VALID_STATUSES.includes(status)) {
    return {
      success: false,
      error: `Invalid status "${status}". Valid values: ${VALID_STATUSES.join(', ')}`,
    };
  }

  const mutation = `
    mutation UpdateDisposition($input: DispositionEventInput!) {
      disposition {
        createDispositionEvent(input: $input) {
          success
          errors {
            message
          }
        }
      }
    }
  `;

  const input = {
    atsIdentifier: ATS_IDENTIFIER,
    applicationId,
    jobId,
    status,
    eventTimestamp: new Date().toISOString(),
  };
  if (note) input.note = note;

  const data = await graphql(mutation, { input });
  const result = data.disposition.createDispositionEvent;

  return {
    success: result.success,
    applicationId,
    jobId,
    status,
    ...(result.errors?.length ? { errors: result.errors } : {}),
  };
}

// ── parse-webhook ─────────────────────────────────────────────
function parseWebhook(jsonFile) {
  const raw = JSON.parse(readFileSync(jsonFile, 'utf8'));

  if (!raw.applicationId || !raw.jobId) {
    return {
      error: 'Invalid Indeed Apply webhook payload: missing applicationId or jobId',
      raw,
    };
  }

  const applicant = raw.applicant || {};
  const name = applicant.name || {};

  return {
    applicationId: raw.applicationId,
    jobId: raw.jobId,
    jobTitle: raw.jobTitle || null,
    appliedAt: raw.appliedAt || null,
    applicant: {
      name: `${name.first || ''} ${name.last || ''}`.trim() || null,
      email: applicant.email || null,
      phone: applicant.phone || null,
      resumeUrl: applicant.resumeUrl || null,
      screeningAnswers: applicant.screeningAnswers || [],
    },
    employer: raw.employer || null,
  };
}

// ── get-token (diagnostic) ────────────────────────────────────
async function getToken() {
  const token = await getAccessToken();
  return {
    success: true,
    tokenPreview: `${token.slice(0, 12)}...`,
    expiresAt: new Date(_tokenCache.expiresAt).toISOString(),
  };
}

// ── Main ──────────────────────────────────────────────────────
try {
  if (cmd === 'update-status' && args[0] && args[1] && args[2]) {
    const [applicationId, jobId, status, ...noteParts] = args;
    const note = noteParts.length > 0 ? noteParts.join(' ') : undefined;
    console.log(JSON.stringify(await updateStatus(applicationId, jobId, status, note), null, 2));

  } else if (cmd === 'parse-webhook' && args[0]) {
    console.log(JSON.stringify(parseWebhook(args[0]), null, 2));

  } else if (cmd === 'get-token') {
    console.log(JSON.stringify(await getToken(), null, 2));

  } else {
    console.log(JSON.stringify({
      usage: [
        'indeed.mjs update-status <applicationId> <jobId> <status> [note...]',
        'indeed.mjs parse-webhook <jsonFile>',
        'indeed.mjs get-token',
      ],
      validStatuses: VALID_STATUSES,
    }, null, 2));
    process.exit(1);
  }
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
