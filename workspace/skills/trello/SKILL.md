---
name: trello
description: Manage the WOOOF Recruitment Trello pipeline
---

# Trello Skill

Use this skill to manage the WOOOF Recruitment Trello board pipeline.

## Get board and list IDs
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs board
```

## List cards (all, or by list name)
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs cards
node /home/node/.openclaw/workspace/scripts/trello.mjs cards --list "Applied"
node /home/node/.openclaw/workspace/scripts/trello.mjs cards --list "Screening"
```

## Create a new card
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs create --list "Applied" --name "Jane Smith — Seek" --desc "CV summary here"
```

## Move a card to a different list
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs move --card <cardId> --list "Contacted"
```

## Add a comment to a card
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs comment --card <cardId> --text "AI assessment: Strong portfolio, 5 years salon experience"
```

## Add a label to a card
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs label --card <cardId> --color green --name "Visa OK"
node /home/node/.openclaw/workspace/scripts/trello.mjs label --card <cardId> --color yellow --name "Visa check needed"
node /home/node/.openclaw/workspace/scripts/trello.mjs label --card <cardId> --color red --name "Offshore candidate"
```

## Add an attachment (CV link etc.)
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs attach --card <cardId> --url "https://..." --name "CV - Jane Smith"
```

## Search for a candidate by name
```bash
node /home/node/.openclaw/workspace/scripts/trello.mjs search "Jane Smith"
```

## Pipeline stages (from AGENTS.md)
- Applied → Contacted → Screening → Portfolio Requested → Janelle Review → Leadership Review → Interview Scheduled → Offer Stage → Hired / Not Progressing
