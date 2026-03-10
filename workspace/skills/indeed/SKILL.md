# Indeed Skill

You can interact with Indeed's API to update candidate disposition statuses and parse webhook application payloads.

## When to use this skill

- When a new Indeed application arrives (via email notification or webhook) — parse it and create a Trello card
- When a candidate's pipeline status changes — update their disposition in Indeed to keep their matching algorithm informed
- When you want to verify Indeed credentials are working

## Workflow: Handling a new Indeed application

1. Parse the webhook payload (if saved to a file): `indeed.mjs parse-webhook /tmp/indeed-payload.json`
2. Check if candidate already exists in Trello (avoid duplicates)
3. Create a Trello card with all candidate details + checklists
4. Download the CV/resume if a `resumeUrl` is present (use curl or fetch)
5. Attach CV to the Trello card
6. Update Indeed status: `indeed.mjs update-status <applicationId> <jobId> VIEWED`
7. Move Trello card to 💬 Contacted and send WhatsApp

## Commands

### Update candidate status in Indeed
```
node /home/node/.openclaw/workspace/scripts/indeed.mjs update-status <applicationId> <jobId> <status> [note]
```

Valid status values (in pipeline order):
- `APPLICATION_RECEIVED` — application just arrived
- `VIEWED` — you've read it
- `CONTACTED` — you've reached out to the candidate
- `INTERVIEW_SCHEDULED` — interview is booked
- `OFFER_MADE` — offer extended
- `HIRED` — candidate accepted and is hired
- `NOT_SELECTED` — rejecting this candidate
- `WITHDRAWN` — candidate withdrew

The optional note is for internal use only — the candidate cannot see it.

**Example:**
```
node /home/node/.openclaw/workspace/scripts/indeed.mjs update-status abc123 job456 CONTACTED "First contact via WhatsApp"
```

### Parse an Indeed Apply webhook payload
```
node /home/node/.openclaw/workspace/scripts/indeed.mjs parse-webhook /tmp/indeed-payload.json
```
Returns structured JSON with: applicationId, jobId, jobTitle, appliedAt, applicant (name, email, phone, resumeUrl, screeningAnswers), employer.

### Verify credentials (diagnostic)
```
node /home/node/.openclaw/workspace/scripts/indeed.mjs get-token
```
Returns success + token preview if `INDEED_CLIENT_ID` and `INDEED_CLIENT_SECRET` are correctly set.

## Pipeline sync — when to update status

Update Indeed disposition whenever the Trello card moves:
- Card created → `APPLICATION_RECEIVED` (or `VIEWED` if you've already read it)
- WhatsApp/contact sent → `CONTACTED`
- Interview scheduled → `INTERVIEW_SCHEDULED`
- Offer sent → `OFFER_MADE`
- Hired → `HIRED`
- Not progressing → `NOT_SELECTED` with a brief reason note

## Important notes

- `INDEED_CLIENT_ID`, `INDEED_CLIENT_SECRET`, and `INDEED_ATS_IDENTIFIER` must be set as env vars in Railway
- The note field (optional) is internal — candidates cannot see it
- Keeping dispositions up to date improves the quality of future Indeed applicants
