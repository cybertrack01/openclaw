---
name: gmail
description: Read and send emails from poppy@wooof.com.au
---

# Gmail Skill

Use this skill to access the poppy@wooof.com.au inbox via the Gmail API.

## List emails
```bash
node /home/node/.openclaw/workspace/scripts/gmail.mjs list "in:inbox"
node /home/node/.openclaw/workspace/scripts/gmail.mjs list "from:seek.com.au"
node /home/node/.openclaw/workspace/scripts/gmail.mjs list "subject:application groomer"
```

## Read a specific email (use ID from list output)
```bash
node /home/node/.openclaw/workspace/scripts/gmail.mjs read <message-id>
```

## Send an email
```bash
node /home/node/.openclaw/workspace/scripts/gmail.mjs send --to "name@example.com" --subject "Your Application" --body "Hi [Name], ..."
```

## Notes
- Always sign emails as poppy@wooof.com.au
- Use WOOOF Dog Grooming in the From name
- For candidates without a phone number, use this skill instead of WhatsApp
