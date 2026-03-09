# SMS Skill (Twilio)

Poppy can send and receive SMS messages via Twilio. The number is **+61485013024** — the same number used for WhatsApp.

---

## Incoming SMS — Webhook Trigger

When a candidate texts +61485013024, **Poppy wakes up automatically**. No polling needed.

The message Poppy receives will look like:
```
Incoming SMS from +61412345678:

Hi yes I'm interested in the grooming role
```

- Extract the phone number from the `Incoming SMS from <number>:` line
- All messages from the same number land in the same session — conversation history is preserved
- Reply using `sms.mjs send --to <number> --body <text>`
- Look up the number in Trello to identify the candidate and continue their pipeline workflow
- If the number isn't found in Trello, treat them as a new enquiry and ask how you can help

---

## Commands

### Send an SMS
```
node /home/node/.openclaw/workspace/scripts/sms.mjs send --to +61412345678 --body "Hi Jane, this is Poppy from WOOOF Dog Grooming!"
```
Returns `{ success: true, sid: "...", status: "queued" }`.

### Check the SMS inbox (incoming messages)
```
node /home/node/.openclaw/workspace/scripts/sms.mjs inbox
```
Returns the 20 most recent inbound messages. Use for catchup or to check for messages that arrived while you were inactive.

### View full conversation with one number
```
node /home/node/.openclaw/workspace/scripts/sms.mjs thread +61412345678
```
Returns all inbound and outbound messages with that number, sorted oldest-to-newest. Run this before replying to get full context.

### Read one message by SID
```
node /home/node/.openclaw/workspace/scripts/sms.mjs read SM1234567890abcdef
```

---

## When to use SMS vs WhatsApp

- **WhatsApp**: Preferred channel (richer messages, read receipts)
- **SMS**: Fallback if a candidate doesn't have WhatsApp, or if WhatsApp fails to deliver
- Always note which channel was used on the Trello card

---

## Important

- Phone numbers must be in E.164 format: `+61412345678` (not `0412345678`)
- +61485013024 is shared with WhatsApp — candidates see the same number on both channels
- After replying via SMS, add a note to the candidate's Trello card and their Seek application