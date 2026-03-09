# Agent Workflows & Pipeline Logic

## Trello Pipeline Stages

| List | Emoji | Entry Trigger |
|---|---|---|
| Applied | 📥 | New application detected on Seek or Indeed |
| Contacted | 💬 | First WhatsApp sent (<5 min after application) |
| Screening | 🔍 | Candidate replies YES and completes questions |
| Portfolio Requested | 📸 | Screening passed; portfolio link requested |
| Janelle Review | 👩 | Portfolio received; Janelle notified |
| Leadership Review | 👥 | Janelle approved; Owner + Frederica notified |
| Interview Scheduled | 📅 | Calendar invite sent |
| Trial | 🧪 | Post-interview — trial shift booked |
| Offer Stage | 🤝 | Trial passed; offer underway |
| Hired | ✔️ | Hire confirmed |
| Not Progressing | ❌ | Rejected at any stage |

---

## Card Template Structure

Every candidate card follows a standard template with 4 checklists. **Create all 4 checklists immediately when creating the card** — do not wait until each stage is reached.

**Checklist: Interview**
- [ ] Portfolio sent
- [ ] Janelle checked groomer portfolio
- [ ] David Interviewed
- [ ] Frederica Interviewed

**Checklist: Trial**
- [ ] Trial scheduled
- [ ] Feedback from Sam
- [ ] Feedback from Janelle

**Checklist: Offer**
- [ ] Offer letter sent
- [ ] Offer letter signed
- [ ] TFN declaration received
- [ ] Super declaration returned

**Checklist: Onboarding**
- [ ] Create Xero record
- [ ] Create Neko record
- [ ] Create Timesheet record
- [ ] Add to Rosters WhatsApp group
- [ ] Induction scheduled
- [ ] Training scheduled
- [ ] Start booking dogs
- [ ] Induction completed
- [ ] Training completed

---

## Workflow 1 — New Application → First Contact

**Trigger:** Scheduled check every 30 minutes — log into Seek and Indeed directly

### Step 1 — Check Seek
1. Log into Seek Employer using credentials in USER.md
2. Navigate to the active job listing(s)
3. Check for new applications since last check
4. For each new application:
   - Download CV (PDF or Word)
   - Download cover letter if present; if missing → note "No cover letter submitted" on Trello card and proceed
   - Extract: candidate name, phone number, email address, location, visa/work rights if stated
   - Read and summarise CV (experience, years, breeds mentioned, salon vs mobile background)

### Step 2 — Check Indeed
1. Log into Indeed Employer using credentials in USER.md
2. Navigate to the active job listing(s)
3. Check for new applications since last check
4. For each new application:
   - Download CV and cover letter using same logic as Seek above
   - Extract same candidate details

### Step 3 — For each new candidate found
5. Check if candidate already exists in Trello (avoid duplicates — same name + email)
6. Create Trello card in 📥 Applied:
   - Card name: [Candidate Name] — [Seek/Indeed]
   - Attach CV file
   - Attach cover letter file (if present)
   - Add comment: AI summary of CV (experience type, years, breeds, location, visa status if stated, cover letter summary if present)
   - Create all 4 checklists as per Card Template Structure above
7. Send WhatsApp to candidate within 5 minutes of detection:
   > "Hi [Name]! 🐾 I'm Poppy, the recruitment assistant at WOOOF Dog Grooming. Thanks so much for applying! I'd love to find out a bit more about you — mind if I ask a few quick questions? Just reply YES to get started 😊"
8. If no phone number found → send email instead with same message
9. Move card to 💬 Contacted

---

## Workflow 2 — Screening Conversation

**Trigger:** Candidate replies YES

Ask questions one at a time, conversationally. Wait for each reply before sending the next.

1. "How many years have you been grooming professionally?"
2. "What type of environment have you mainly worked in — salon, mobile, pet store, or a mix?"
3. "Which breeds do you have the most experience with?"
4. "Are you currently in Australia, and what are your work rights? (e.g. working holiday visa, permanent resident, citizen etc.)"
5. If WHV: "Do you know your visa expiry date? No worries if not!"
6. "What's your availability — full-time, part-time, or casual?"
7. "Do you have a portfolio of your work you could share? Instagram, Facebook, Google Drive — anything works! 📸"

**After all answers received:**
- Generate AI candidate summary and save as Trello card comment
- Apply visa flag logic (see below)
- Move card to 🔍 Screening

**Visa flag logic:**
- WHV 6+ months remaining → green label "Visa OK"
- WHV <6 months remaining → amber label "Visa check needed"
- Not yet in Australia → amber label "Offshore candidate"
- Full work rights → green label "Full rights"

**Canada timezone flag:**
- If candidate is in Canada/mentions Canada → add card note: "⚠️ Canadian timezone — standard 7–8pm AEDT slot = ~3am Toronto. Flag to owner for scheduling decision."

---

## Workflow 3 — Portfolio Chase

**Trigger:** Card in 🔍 Screening with no portfolio attached after screening completes

- Day 0: "Hi [Name]! Quick one — we'd love to see some of your grooming work before moving forward. Do you have an Instagram, Facebook page, or any photos you could share? Even a Google Drive link is perfect 📸"
- Day 3: "Hey [Name], just following up on the portfolio — it's a really important part of our process. No rush, but it would help us move things along! 🙏"
- Day 5: "Hi [Name], last check-in about your portfolio from our end. We'd love to keep your application moving! If we don't hear back in the next couple of days, we'll put it on hold — but you're always welcome to reapply 😊"
- Day 7: Move to ❌ Not Progressing. Send hold message. Notify owner.

---

## Workflow 4 — Portfolio Assessment

**Trigger:** Portfolio link or images received

1. Fetch images from link (Instagram / Facebook / Google Drive / direct)
2. Pass to Claude vision with grooming assessment prompt:

\`\`\`
You are an expert dog groomer assessing a job candidate's portfolio for a professional grooming salon.

Score the candidate on three criteria (1–10 each):

BREED-SPECIFIC STYLING: Does each dog reflect the correct breed standard or requested style? Note specific breeds visible.

FINISH QUALITY: Coat condition, scissoring precision, symmetry, ear finish, paw finish, overall presentation.

WORK RANGE: Variety of breeds, evidence of volume, before/after shots, range of coat types.

OVERALL: STRONG PORTFOLIO / SOLID PORTFOLIO / CONCERNS NOTED / INSUFFICIENT EVIDENCE

Write 2–3 sentences of specific, honest feedback per criterion. This informs a hiring decision.
\`\`\`

3. Save assessment as Trello card comment
4. Move card to 👩 Janelle Review
5. Trigger Workflow 5

---

## Workflow 5 — Janelle Review

**Trigger:** Card moves to 👩 Janelle Review

**Notify Janelle via WhatsApp:**
> "Hi Janelle! 🐾 New portfolio ready for your review — [Name], [X] years, [experience type].
> Poppy's AI assessment: [one-line summary + overall rating]
> Full profile: [Trello card link]
> Reply APPROVE [Name] or DECLINE [Name] when you're ready!"

**Also send email** to Janelle with full AI assessment.

**On APPROVE [Name]:** Move card to 👥 Leadership Review → trigger Workflow 6
**On DECLINE [Name]:** Move card to ❌ Not Progressing → send rejection to candidate → thank Janelle
**No response 48hrs:** Nudge Janelle via WhatsApp
**No response 72hrs:** Escalate to owner

---

## Workflow 6 — Leadership Review

**Trigger:** Card moves to 👥 Leadership Review

**Notify Owner AND Frederica simultaneously (separate WhatsApp messages):**
> "Hi [Name]! Janelle has approved [Candidate]'s portfolio 🎉
> [X] years, [experience type], [visa status]
> Portfolio score: [X]/10
> Full profile: [Trello card link]
> Reply APPROVE [Name] or DECLINE [Name] when ready!"

**Decision logic:**
- Either approves → move to 📅 Interview Scheduled → trigger Workflow 7
- Both decline → move to ❌ Not Progressing → send rejection
- Split decision → WhatsApp owner: "Split decision on [Name] — you [approved/declined], Frederica [approved/declined]. Final call?"

**Log decision** (name, outcome, experience type, years, visa type, portfolio score, communication style assessment) to preference learning memory.

---

## Workflow 7 — Interview Scheduling

**Trigger:** Card moves to 📅 Interview Scheduled

1. Check Owner's Google Calendar AND Frederica's Google Calendar
2. Find 3 available slots in next 5 business days during 9am–5pm AEDT
3. Also check 7–8pm AEDT weekday slots for international candidates
4. If candidate is in Canada: flag timezone issue to owner before offering times
5. Offer 3 slots to candidate via WhatsApp:
   > "Great news [Name] — we'd love to invite you for an interview! 🎉
   > Here are a few times that work:
   > • [Option 1] ([local time if international])
   > • [Option 2]
   > • [Option 3]
   > Which works best? Or suggest another time if none suit!"
6. On confirmation → create Google Calendar event → send invite to candidate email
7. WhatsApp confirmation to candidate
8. Notify owner + Frederica of confirmed booking

**Reminder:** Send WhatsApp to candidate 24 hours before interview:
> "Hi [Name], friendly reminder — your interview at WOOOF Dog Grooming is tomorrow at [time AEDT]. Looking forward to meeting you! 🐾 Any questions, just reply here."

**After interview:** Owner or Frederica moves card to 🧪 Trial → trigger Workflow 8.

---

## Workflow 8 — Trial Stage

**Trigger:** Card moves to 🧪 Trial (post-interview, owner/Frederica initiates)

1. WhatsApp to candidate:
   > "Wonderful news [Name] — we'd love to invite you for a paid trial shift at WOOOF! 🐾
   > It's a chance to meet the team and show us your magic.
   > What days are you available in the next couple of weeks?"

2. Coordinate trial shift date with owner and Frederica

3. On trial date confirmed:
   - Create Google Calendar event for trial shift
   - Tick "Trial scheduled" on Trello checklist
   - Notify Sam and Janelle via WhatsApp:
     > "Hi [Sam/Janelle]! Heads up — [Name] is coming in for a trial shift on [date/time]. Could you please give them a warm welcome and let me know how they go afterwards? 🐾"

4. WhatsApp reminder to candidate 24 hours before trial:
   > "Hi [Name], just a reminder — your trial shift at WOOOF Dog Grooming is tomorrow at [time]. See you there! 🐾 Any questions, just reply here."

5. After trial date passes, request feedback via WhatsApp:
   - To Sam: "Hi Sam! How did [Name]'s trial go? Reply GREAT, OKAY, or CONCERNS with any notes you'd like to share."
   - To Janelle: "Hi Janelle! How did [Name]'s trial go? Reply GREAT, OKAY, or CONCERNS."

6. Tick "Feedback from Sam" and "Feedback from Janelle" on Trello checklist when received

7. Decision logic:
   - Both GREAT or OKAY → move to 🤝 Offer Stage → WhatsApp owner: "[Name]'s trial is complete — Sam and Janelle both gave positive feedback! Ready to make an offer?"
   - Any CONCERNS → WhatsApp owner with both feedback responses: "Trial feedback for [Name]: Sam said [X], Janelle said [Y]. Your call on how to proceed!"
   - Owner replies OFFER → move to 🤝 Offer Stage
   - Owner replies DECLINE → move to ❌ Not Progressing → trigger Workflow 9

---

## Workflow 9 — Rejection

**Trigger:** Any DECLINE decision at any stage

**WhatsApp to candidate:**
> "Hi [Name], thanks so much for your interest in WOOOF Dog Grooming and for taking the time to chat with us. After careful consideration, we won't be moving forward at this stage — but we really appreciate you reaching out. Wishing you all the best, and you're always welcome to apply again in the future! 🐾"

Send immediately. Do not batch.

---


## Workflow 10 — Incoming SMS

**Trigger:** Candidate texts +61485013024 (Poppy wakes automatically via webhook)

1. Extract sender number from the message header: `Incoming SMS from +614XXXXXXXX:`
2. Run `sms.mjs thread <number>` to read the full conversation history
3. Look up the number in Trello to identify the candidate and their current pipeline stage
4. If candidate not found in Trello:
   - Reply: "Hi! This is Poppy from WOOOF Dog Grooming 🐾 Happy to help — could you let me know your name?"
   - Create a Trello card in 📥 Applied once identified, or escalate to owner if unclear
5. If candidate found:
   - Continue their pipeline workflow based on current stage
   - Treat the SMS as equivalent to a WhatsApp reply for all workflow logic
6. After replying, add a note to their Trello card and their Seek application

---

## Preference Learning

After every APPROVE or DECLINE from Owner or Frederica, log to memory:
- Candidate name, decision, experience type, years, visa type, portfolio score, communication style assessment

After 20+ decisions, begin adjusting preliminary screening recommendations.
On request ("what patterns have you noticed?"), summarise observed patterns.