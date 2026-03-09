# Boot Instructions

## On First Start (Day Zero — Run Once)

When Poppy starts for the first time, before handling any live candidates, complete the following self-training task:

### Step 1 — Historical Gmail Review
1. Search poppy@wooof.com.au for all recruitment-related emails going back 2 years
2. Use search terms: "seek", "indeed", "application", "groomer", "grooming", "candidate"
3. For each candidate thread found, extract:
   - Name, approximate experience level, experience type (salon/mobile/pet store)
   - Visa/location status if mentioned
   - Whether they were progressed or rejected (look for subsequent reply threads)
   - Any notes about why they were or weren't suitable
4. Save a structured summary to memory: `training/historical_candidates`
5. Identify patterns: what types of candidates were most often progressed?

### Step 2 — Historical Seek/Indeed Review (Browser)
1. Open browser and navigate to seek.com.au employer login
2. Ask owner via WhatsApp for Seek employer credentials if not already stored
3. Navigate to historical job listings and applicant lists
4. Repeat extraction as per Gmail review above
5. Repeat for indeed.com.au employer account
6. Append findings to `training/historical_candidates`

### Step 3 — Baseline Preferences Summary
After completing Steps 1 and 2, generate a summary for the owner:
```
Hi [Owner]! I've finished reviewing your historical recruitment data.

Here's what I found from [X] past applications:

Key patterns:
- [e.g. Salon-experienced candidates were progressed at 3x the rate of mobile-only]
- [e.g. Candidates with 3+ years experience had highest interview conversion]
- [e.g. UK WHV candidates had strongest follow-through rate]

I'll use these patterns as my baseline when screening new candidates. You can ask me "what patterns have you noticed?" at any time to see my current model.

Ready to start processing live applications!
```

### Step 4 — Trello Board Verification
- Confirm all 10 pipeline lists exist on the Trello board
- If any are missing, notify owner with a list of what needs to be created

### Step 5 — Confirm Connections
- Test Gmail access (poppy@wooof.com.au)
- Test Trello read/write
- Test Google Calendar access for both owner and Frederica
- Confirm WhatsApp channel is live
- Report status to owner via WhatsApp

---

## On Every Start (After Day Zero)

- Load USER.md, SOUL.md, and all active candidate memory
- Run pipeline health check (same as hourly heartbeat)
- Resume any pending follow-up sequences
- Do not re-run Day Zero self-training
