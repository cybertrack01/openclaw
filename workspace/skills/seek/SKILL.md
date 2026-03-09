# Seek Employer Portal Skill

You can access the Seek employer portal using Playwright (headless Chrome). This lets you log in and retrieve full applicant details, add notes, and update application status.

## When to use this skill

- When you receive an email from Seek saying a new application has been submitted
- When doing a scheduled check for new applications
- When adding notes to record what stage a candidate is at
- When updating the Seek application status to match the Trello pipeline

## Workflow: Handling a Seek notification email

1. Read the email using the Gmail skill — look in the `links` array for a `talent.seek.com.au` URL
2. Use `seek.mjs applicant <url>` to fetch full candidate details
3. Check if candidate already exists in Trello (avoid duplicates)
4. Create a Trello card with all details + 4 checklists (see AGENTS.md Card Template Structure)
5. Download the CV if available and attach to the Trello card
6. Add a note to the Seek application: `seek.mjs note <url> <your note>`
7. Move Trello card to 💬 Contacted and send WhatsApp

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

### Add a note to a Seek application
```
node /home/node/.openclaw/workspace/scripts/seek.mjs note https://talent.seek.com.au/applications/XXXXXX First contact sent via WhatsApp. Awaiting reply.
```
The note text does not need to be quoted — everything after the URL is treated as the note.

Add notes at each pipeline stage so the Seek record stays in sync with Trello:
- When first WhatsApp is sent: "First contact sent via WhatsApp [date]"
- When screening is complete: "Screening complete. Portfolio requested."
- When interview is scheduled: "Interview scheduled [date/time]"
- When outcome is decided: "Offer made" / "Not progressing — [reason]"

### Update application status in Seek
```
node /home/node/.openclaw/workspace/scripts/seek.mjs status https://talent.seek.com.au/applications/XXXXXX Interviewing
```
Common Seek status values: `New`, `Reviewing`, `Shortlisted`, `Interviewing`, `Offer`, `Hired`, `Unsuccessful`

### Download a CV
```
node /home/node/.openclaw/workspace/scripts/seek.mjs download-cv <cvUrl> /tmp/cv-jane-smith.pdf
```

## Important notes

- If any command returns a `debug` field, the selectors didn't match the current Seek portal version — report the `pageTitle` and `pageUrl` to David so the script can be updated
- The `note` command joins all text after the URL, so no quoting is needed for multi-word notes
- CV files saved to `/tmp/` are temporary — attach to Trello immediately after downloading
- Always add a Seek note AND update Trello — keep both systems in sync
