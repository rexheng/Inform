# CLAUDE.md — ClearPath

> This file is the primary context document for all Claude instances working on
> this codebase. Read it fully before writing any code. Always check
> `/hackathon/criteria/` before making product decisions.

---

## What we are building

ClearPath is a web application that makes NHS cancer waiting time data actionable.
The data is public but buried in government spreadsheets. We surface it in three
distinct products, developed across three Git branches, for three distinct users.

### The core problem
In London, wait times for the same cancer condition vary from 6 to 17 weeks
depending on which trust a GP refers to. Patients don't know shorter waits exist
nearby. They don't know they have a legal right to switch. Nobody tells them.

### The three products
```
branch: feature/map            → visualise cancer waiting times across London
branch: feature/patient        → help individual patients find shorter waits
branch: feature/nhs-dashboard  → help NHS trusts fill cancelled slots
```

Each branch is a self-contained product. They share a data layer (`/data`) and
a Claude API utility (`/src/lib/claude.js`) but otherwise do not depend on each other.

---

## Repo structure

```
clearpath/
│
├── CLAUDE.md                        ← you are here, read first
│
├── /hackathon/                      ← READ BEFORE MAKING ANY PRODUCT DECISIONS
│   └── /criteria/
│       ├── overview.md              ← full hackathon brief and theme
│       ├── rubric.md                ← scoring rubric (impact / technical / ethics / presentation)
│       ├── track-health.md          ← Track 1: Biology & Physical Health specifics
│       └── ethical-questions.md     ← critical questions every team must answer
│
├── /data/
│   ├── trusts.json                  ← pre-processed NHS trust wait times by condition
│   ├── deprivation.json             ← ONS IMD scores by London borough
│   ├── trust-codes.json             ← London NHS trust codes and geo coordinates
│   └── /raw/                        ← original NHS CSVs (do not import directly)
│
├── /src/
│   ├── /lib/
│   │   ├── claude.js                ← shared Claude API utility (all branches use this)
│   │   ├── nhs.js                   ← trust lookup, wait time queries, distance calc
│   │   └── imd.js                   ← deprivation score lookups
│   └── /components/
│       └── shared/                  ← any shared UI components
│
├── /map/                            ← branch: feature/map
├── /patient/                        ← branch: feature/patient
├── /nhs-dashboard/                  ← branch: feature/nhs-dashboard
│
└── package.json
```

---

## Shared data layer

All three branches consume the same pre-processed data files. Do not load raw
NHS CSVs in the browser. Pre-process them once into the formats below.

### trusts.json
```json
{
  "R1H": {
    "name": "Barts Health NHS Trust",
    "lat": 51.5194,
    "lng": -0.0584,
    "borough": "Tower Hamlets",
    "waits": {
      "colorectal": 14,
      "breast": 9,
      "lung": 17,
      "prostate": 11
    },
    "target_met": {
      "28day": false,
      "62day": false
    }
  }
}
```

### deprivation.json
```json
{
  "Tower Hamlets": { "imdDecile": 1, "imdScore": 42.3 },
  "Hackney":       { "imdDecile": 2, "imdScore": 38.1 }
}
```

### Data sources
- NHS England Cancer Waiting Times CSVs (monthly, provider-level)
  https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/
  Files needed: 62-Day Combined by Cancer (Provider), 28-Day Faster Diagnosis (Provider)
- ONS Index of Multiple Deprivation by LSOA → aggregate to borough
- Trust geo coordinates: hardcode from NHS ODS or Google Maps for London trusts

### Key London trust codes
| Trust | Code | Borough |
|---|---|---|
| Barts Health | R1H | Tower Hamlets |
| Homerton | RQX | Hackney |
| King's College | RJZ | Southwark |
| Guy's and St Thomas' | RJ1 | Lambeth |
| Royal Free | RAL | Camden |
| UCLH | RRV | Camden |
| Lewisham and Greenwich | RJ2 | Lewisham |
| Barking Havering Redbridge | RAP | Havering |
| Whipps Cross (Barts) | R1H | Waltham Forest |
| Chelsea and Westminster | RQM | Kensington |

---

## Shared Claude API utility

All letter and message generation goes through `/src/lib/claude.js`.
Do not call the Anthropic API directly from components.

```javascript
// /src/lib/claude.js
export async function generateWithClaude(systemPrompt, userPrompt, maxTokens = 500) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt, maxTokens })
  });
  const data = await response.json();
  return data.content;
}
```

Server-side API route (`/api/generate.js`) handles the Anthropic key — never
expose `ANTHROPIC_API_KEY` in the browser.

Model: `claude-sonnet-4-6`
All API calls must complete under 5 seconds. Test this before the demo.

---

## Environment variables

```
ANTHROPIC_API_KEY=
CARTO_API_KEY=
```

---

## Tech stack

```
Frontend:    React + Tailwind
Map:         Carto Maps API
AI:          Claude API (claude-sonnet-4-6)
Hosting:     Vercel
```

---
---

# Branch 1: feature/map

## Purpose
Visualise cancer waiting times across all London NHS trusts on an interactive map.
This is the "proof of the problem" — it makes the inequality visible in under 10
seconds without any explanation needed.

## Location
```
/map/
├── Map.jsx              ← main map component
├── TrustSidebar.jsx     ← click a trust → show wait time detail
├── ConditionFilter.jsx  ← dropdown: select cancer type
├── DeprivationLayer.jsx ← toggle: overlay IMD deprivation data
└── map.css
```

## What to build

### Core map
- Render all London NHS trusts as interactive circles on a Carto base map
- Colour-code by wait time for selected condition:
  - Red `#F09595`: 15+ weeks
  - Amber `#FAC775`: 12–14 weeks
  - Yellow-green `#C0DD97`: 9–11 weeks
  - Green `#5DCAA5`: under 9 weeks
- Circle size can encode volume (number of patients waiting) if data available

### Condition selector
- Dropdown: Colorectal, Breast, Lung, Prostate, All cancers
- Map re-renders on selection
- Default: Colorectal (most relevant for our Sarah persona)

### Trust click → sidebar
On clicking a trust circle, show:
- Trust name and borough
- Current wait time for selected condition
- 28-day and 62-day target status (met / missed)
- Trend: improving or worsening vs 3 months ago (if data allows)
- Button: "Find shorter waits near here" → links to patient branch URL

### Deprivation overlay toggle
- When enabled: borough polygons tinted by IMD decile
- Makes the correlation between deprivation and long waits visually obvious
- Use ONS IMD data from `deprivation.json`

### Legend
Always visible. Show the four wait-time colour bands and what they mean relative
to the NHS 62-day target (target = under 9 weeks for first treatment).

## What this branch does NOT do
- No user authentication
- No patient data
- No letter generation
- No booking or referral functionality

## Acceptance criteria
- [ ] Map loads with all London trusts rendered correctly
- [ ] Colour coding updates when condition is changed
- [ ] Clicking a trust opens the sidebar with correct data
- [ ] Deprivation overlay toggles on and off cleanly
- [ ] Map is usable on a laptop screen at 1280px width minimum

---
---

# Branch 2: feature/patient

## Purpose
Help an individual cancer patient discover that a shorter wait exists nearby and
give them everything they need to request a transfer — including a Claude-generated
letter citing their NHS constitutional rights.

## Location
```
/patient/
├── PatientLookup.jsx    ← entry point: postcode + condition input
├── WaitComparison.jsx   ← the core screen: current vs alternatives
├── RightsPanel.jsx      ← NHS rights, target status, PALS number
├── LetterGenerator.jsx  ← Claude generates transfer request letter
└── patient.css
```

## The user
Sarah Chen, 47, Shadwell (Tower Hamlets, IMD decile 1). Referred after a positive
FIT test. 11 weeks waiting at Barts. Does not know she can switch trusts.

## What to build

### Step 1: Lookup screen
Simple form:
- Postcode input (used to find nearby trusts, not stored)
- Condition selector: Colorectal / Breast / Lung / Prostate
- "Find shorter waits" button

### Step 2: Wait comparison screen
This is the emotional core. Make it clear and stark.

Top section — current situation:
- Weeks waiting (large number, amber or red if past target)
- Condition and referring trust
- Target status badge: "28-day target: missed"

Middle section — nearby alternatives:
- List of 3–4 nearby trusts sorted by wait time (ascending)
- For each: trust name, wait time, distance in miles, rough travel time
- Best option highlighted in green
- "You could save X weeks" copy on the best option

Bottom comparison card — the gut-punch:
```
If you switch          vs        If you stay
6 weeks                          11+ weeks
Whipps Cross                     Barts NHS Trust
```

### Step 3: Rights panel
- Confirm whether 28-day faster diagnosis standard has been breached
- One-line plain English explanation of NHS patient choice right
- PALS (Patient Advice and Liaison Service) number: 0800 953 0667
- Safeguard copy (required — do not remove):
  "Wait times are indicative based on monthly NHS data. Clinical suitability
  should always be discussed with your GP. Staying with your current trust
  is always a valid choice."

### Step 4: Letter generation
Button: "Generate my transfer request letter"
- Calls Claude API via `/src/lib/claude.js`
- Must complete in under 5 seconds
- Letter appears inline, fully editable before copying
- Copy to clipboard button
- Print button

### Claude system prompt for patient letter
```
You are helping an NHS cancer patient exercise their legal right to request a
transfer to a trust with a shorter waiting time. Write a clear, formal letter
from the patient to their GP. The letter must:
- State the patient's current situation (condition, current trust, weeks waiting)
- Name the alternative trust they are requesting and its current wait time
- Cite NHS Constitution patient choice rights (Section 2a)
- Request the GP to action a re-referral to the named trust
- Be under 200 words
- Be clinically neutral — do not imply the current trust is inadequate
- Be respectful and non-confrontational in tone
- End with space for the patient's name and date

Do not add any commentary outside the letter itself.
```

### Claude user prompt template
```
Patient situation:
- Name: [name or "I"]
- Condition: [condition]
- Current trust: [trust name]
- Weeks waiting: [n]
- Requested trust: [trust name]
- Requested trust wait time: [n] weeks
- Patient postcode: [postcode]

Write the transfer request letter.
```

## What this branch does NOT do
- Does not make clinical recommendations
- Does not contact the NHS directly
- Does not store any patient data
- Does not tell the patient they must switch — only that the option exists

## Acceptance criteria
- [ ] Postcode + condition lookup returns correct nearby trust list
- [ ] Comparison card renders correctly with real trust data
- [ ] Rights panel shows correct target breach status
- [ ] Claude letter generates in under 5 seconds
- [ ] Letter is editable and copyable
- [ ] Safeguard copy is visible on screen before letter generation
- [ ] No patient data is stored or logged anywhere

---
---

# Branch 3: feature/nhs-dashboard

## Purpose
Give NHS trust administrators a dashboard to monitor their appointment pipeline
and automatically fill cancelled cancer appointments by dispatching Claude-generated
outreach messages to the next eligible patient on the waitlist.

## Location
```
/nhs-dashboard/
├── Dashboard.jsx        ← main admin view: pipeline overview
├── WaitlistPanel.jsx    ← ranked waitlist per condition
├── SlotAlert.jsx        ← cancellation detected → fill the slot
├── OutreachMessage.jsx  ← Claude generates SMS/letter for next patient
└── dashboard.css
```

## The user
An NHS outpatient coordinator at a London trust. Manages appointment schedules
for cancer pathways. Currently fills cancellations manually by phone, often fails
to backfill in time, wastes the slot.

## What to build

### Main dashboard
Overview metrics for the trust:
- Total patients on waitlist by condition (colorectal, breast, lung, prostate)
- Number of appointments this week
- Slots at risk (patients with upcoming appointments flagged as high DNA risk)
- Average wait time per condition vs London average
- Slots wasted this month (running total)

### Waitlist panel
Table of patients waiting, ranked by priority score.

Priority score formula:
```
priority = weeks_waiting × deprivation_multiplier
deprivation_multiplier: IMD decile 1-2 = 1.5, decile 3-5 = 1.2, decile 6-10 = 1.0
```

This ensures the longest-waiting patients in the most deprived areas are
contacted first. Name this logic clearly in the UI.

Columns: rank, patient ID (anonymised), condition, weeks waiting, borough,
deprivation band, status (waiting / contacted / confirmed)

### Slot alert flow
When a cancellation occurs (simulated in demo via a "Simulate cancellation" button):

1. Alert banner appears: "[Patient ID] has cancelled their [condition] appointment
   on [date] at [time]. Slot available."
2. ClearPath automatically identifies the top-ranked patient from the waitlist
   for that condition
3. Shows patient card: weeks waiting, borough, deprivation band
4. "Generate outreach message" button → Claude drafts SMS

### Claude system prompt for slot outreach SMS
```
You are helping an NHS trust fill a newly available cancer appointment slot.
Write a short, friendly SMS to a patient on the waiting list. The message must:
- Be under 160 characters if possible (one SMS)
- Include the trust name, appointment date, time and condition
- Ask the patient to confirm by replying YES
- Include a callback number if they have questions
- Be warm and human — this patient has been waiting a long time

Do not add any commentary outside the SMS itself.
```

### Claude user prompt template for SMS
```
Patient first name: [name]
Trust: [trust name]
Appointment date: [date]
Appointment time: [time]
Condition: [condition]
Callback number: [number]
Weeks patient has been waiting: [n]

Write the outreach SMS.
```

### Sent messages log
Simple table showing all outreach messages sent, patient response (YES/NO/no reply),
and whether the slot was filled. This is the impact evidence for the demo.

## Simulated data for demo
The waitlist and cancellation events are entirely simulated. Use realistic dummy
data — real names, realistic waiting times, real London boroughs. No real patient
records under any circumstances.

Suggested dummy patients for demo:
```javascript
const demoWaitlist = [
  { id: "PT-0042", name: "Marcus", condition: "colorectal", weeksWaiting: 14,
    borough: "Tower Hamlets", imdDecile: 1 },
  { id: "PT-0107", name: "Amara", condition: "colorectal", weeksWaiting: 11,
    borough: "Newham", imdDecile: 2 },
  { id: "PT-0023", name: "David", condition: "colorectal", weeksWaiting: 9,
    borough: "Bromley", imdDecile: 7 },
]
```

## What this branch does NOT do
- Does not actually send SMS messages
- Does not connect to real NHS appointment systems
- Does not store or process real patient data
- Does not make clinical triage decisions

## Acceptance criteria
- [ ] Dashboard renders with correct summary metrics
- [ ] Waitlist is correctly ranked by priority score
- [ ] Simulated cancellation triggers the slot alert flow
- [ ] Claude SMS generates in under 5 seconds
- [ ] Sent messages log updates after each outreach
- [ ] Priority scoring logic is visible in the UI with explanation

---
---

## Build priority

```
Must work perfectly for demo (do these first):
  [ ] /data pipeline: trusts.json and deprivation.json pre-processed from NHS CSVs
  [ ] feature/map: map renders, colour coding works, trust click works
  [ ] feature/patient: comparison card renders, Claude letter generates live

Build if time allows:
  [ ] feature/map: deprivation overlay
  [ ] feature/nhs-dashboard: full dashboard and slot recovery flow
  [ ] feature/patient: print button on letter

Polish last:
  [ ] Mobile responsiveness
  [ ] Loading states on all Claude API calls
  [ ] Vercel deploy with environment variables set
  [ ] Error handling if Claude API is slow
```

---

## Ethical guardrails

Check `/hackathon/criteria/ethical-questions.md` for the full list of questions
the judges will ask. Every product decision should be defensible against those
questions.

Quick reference:

| Risk | What we do |
|---|---|
| Clinical mismatch | All actions route through GP. Letters request a conversation, not automatic transfer. |
| Patient pressure | UI copy: "Staying with your current trust is always a valid choice." |
| Data staleness | Show data date on every comparison. Label all wait times as "indicative." |
| Digital exclusion | Letter is printable. Flag this gap honestly — do not claim to solve it. |
| Real patient data | Demo uses simulated data only. No real records anywhere in the codebase. |

---

## What ClearPath is NOT

- Not a booking system
- Not a clinical triage tool
- Not a replacement for GP judgment
- Not dependent on NHS IT integration
- Not handling real patient data

---

*ClearPath — LSE Claude Builder Club Hackathon, March 2026*
