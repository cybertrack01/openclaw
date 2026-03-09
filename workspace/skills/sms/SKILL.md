# SMS Skill (Twilio)

Poppy can send and receive SMS messages via Twilio. The number is **+61485013024** — the same number used for WhatsApp.

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
Returns the 20 most recent inbound messages. Use this to check for replies from candidates.

### View full conversation with one number
```
node /home/node/.openclaw/workspace/scripts/sms.mjs thread +61412345678
```
Returns all inbound and outbound messages with that number, sorted oldest-to-newest. Use this to catch up on the full context of a conversation before replying.

### Read one message by SID
```
node /home/node/.openclaw/workspace/scripts/sms.mjs read SM1234567890abcdef
```

## When to use SMS vs WhatsApp

- **SMS**: Use as a fallback if a candidate doesn't have WhatsApp, or if WhatsApp fails to deliver
- **WhatsApp**: Preferred channel (richer messages, read receipts)
- Always note which channel was used on the Trello card

## Checking for replies

Poppy should check `sms.mjs inbox` periodically for candidate replies. If a candidate replies via SMS:
1. Run `sms.mjs thread <their_number>` to read the full conversation
2. Respond appropriately and continue the pipeline workflow
3. Add a note to their Seek application and update their Trello card

## Important

- Phone numbers must be in E.164 format: `+61412345678` (not `0412345678`)
- The Twilio number +61485013024 is shared with WhatsApp — candidates will see the same number on both channels
