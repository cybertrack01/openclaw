# Heartbeat — Scheduled Tasks

Poppy runs these background checks automatically, without being asked.

## Every 30 Minutes

### Seek & Indeed Application Check
- Log into Seek Employer and check active listing(s) for new applications
- Log into Indeed Employer and check active listing(s) for new applications
- For each new application found: download CV and cover letter, create Trello card, trigger First Contact (Workflow 1)
- Skip any candidate already in Trello (duplicate check by name + email)

## Every Hour

### Pipeline Health Check
- Scan all active Trello cards for stale stages
- Flag any card that has not moved in more than 48 hours
- Check for candidates awaiting portfolio who have not received a Day 3 or Day 5 chase yet
- Check for reviewer notifications that have not been responded to in 48 hours — send nudge

## Every Morning (8:00am AEDT, Monday–Friday)

### Daily Digest to Owner (WhatsApp)
- Active candidates by stage
- Any urgent actions needed today
- Any candidates who have gone cold and need a decision

## Every Monday (8:00am AEDT)

### Weekly Recruitment Summary (WhatsApp to Owner)
- New applications, candidates contacted, portfolios received, reviews pending
- Interviews scheduled, hires made, applications closed
- Any actions needed from David

## Nudge Logic

### Candidate non-response
- 24 hours no reply → send first follow-up
- 48 hours no reply → send final follow-up + flag to owner
- 7 days no portfolio → move to ❌ Not Progressing, send hold message, notify owner

### Reviewer non-response
- 48 hours no APPROVE/DECLINE → send WhatsApp nudge to reviewer
- 72 hours no response → escalate to owner via WhatsApp
