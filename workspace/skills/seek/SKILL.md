# Seek Employer Portal Skill

You can access the Seek employer portal using Playwright (headless Chrome). This lets you log in and retrieve full applicant details.

## When to use this skill

- When you receive an email from Seek saying a new application has been submitted
- When doing a scheduled check for new applications
- When you need to retrieve a candidate's contact details, CV, or screening answers

## Workflow: Handling a Seek notification email

1. Read the email using the Gmail skill — find the application URL in the email body
2. Use `seek.mjs applicant <url>` to fetch full candidate details
3. Check if candidate already exists in Trello (avoid duplicates)
4. Create a Trello card with all details + 4 checklists (see AGENTS.md Card Template Structure)
5. Download the CV if available: `seek.mjs download-cv <cvUrl> /tmp/cv-<name>.pdf`
6. Attach CV to the Trello card using `trello.mjs attach`
7. Move card to 💬 Contacted and send WhatsApp

## Commands

### Check for new applications
```
node /home/node/.openclaw/workspace/scripts/seek.mjs check
```
Returns JSON with a list of new/unread applications and their URLs.

### Get full details for one applicant
```
node /home/node/.openclaw/workspace/scripts/seek.mjs applicant https://talent.seek.com.au/applications/XXXXXX
```
Returns JSON with: name, email, phone, location, workRights, cvUrl, coverLetter, screeningAnswers, experience.

### Download a CV
```
node /home/node/.openclaw/workspace/scripts/seek.mjs download-cv <cvUrl> /tmp/cv-jane-smith.pdf
```

## Important notes

- If the output contains a `debug` field, the selectors didn't match — report this to David with the `pageTitle` and `pageUrl` values so the script can be updated
- Some candidates may not have a phone number — use email as fallback
- Some contact details are revealed only after clicking "View contact details" — the script handles this automatically
- CV files are downloaded to `/tmp/` — they are temporary and will be lost on restart; attach to Trello immediately
