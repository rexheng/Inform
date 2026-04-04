# ClearPath

**An NHS cancer waiting time tool that helps patients find shorter waits and exercise their right to choose.**

> You have the legal right to choose which NHS trust treats you. Most patients don't know this, and even if they do, they can't easily compare waiting times across hospitals.
>
> ClearPath fixes that.

Built at the LSE Claude Builder Club Hackathon, March 2026 | 2-person team

**Live:** [inform-eight.vercel.app](https://inform-eight.vercel.app)

---

## The Problem

NHS cancer waiting times vary significantly between trusts. A patient referred for breast cancer treatment at one London hospital might wait 40 days. At a trust 15 minutes away, the wait could be 20 days.

Under the NHS Constitution, every patient has the [legal right to choose](https://www.nhs.uk/nhs-services/hospitals/about-nhs-hospital-services/your-choices-in-the-nhs/) their provider for elective care. In practice, almost nobody exercises this right because:

1. Waiting time data is buried across NHS England statistical publications
2. There's no tool that compares trusts by cancer type, location, and urgency
3. Even if a patient finds a shorter wait, requesting a transfer requires a letter to their GP that most people don't know how to write

ClearPath solves all three.

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│  PATIENT FLOW                                             │
│                                                           │
│  Enter: hospital, cancer type, postcode                   │
│         |                                                 │
│         v                                                 │
│  Algorithm weights:                                       │
│    - Location proximity                                   │
│    - Current wait times (FDS, 31-day, 62-day)            │
│    - Urgency                                              │
│    - Availability                                         │
│         |                                                 │
│         v                                                 │
│  Side-by-side trust comparison                            │
│         |                                                 │
│         v                                                 │
│  AI-generated GP transfer request letter                  │
│  (print or copy)                                          │
└──────────────────────────────────────────────────────────┘
```

### Three ways to use it

**Patient flow** -- Enter your hospital, cancer type, and postcode. ClearPath finds nearby trusts with shorter waits, compares them side-by-side, and generates a GP transfer request letter you can print or copy.

**Map explorer** -- Browse all 20+ London NHS trusts on an interactive map. Colour-coded wait times by cancer type. Click any trust for detailed diagnosis, treatment, and referral-to-treatment metrics.

**AI chat assistant** -- Context-aware chat on the map page. Ask questions about wait times, hospital comparisons, and general cancer information. Grounded in NHS data.

### The Algorithm

The core ranking engine weights multiple factors to surface the best alternatives:

| Factor | What it measures |
|--------|-----------------|
| Location proximity | Distance from patient's postcode to each trust |
| Wait times | FDS (28-day faster diagnosis), 31-day treatment, 62-day referral-to-treatment |
| Urgency | Patient-selected urgency level adjusts weighting |
| Availability | Whether the trust accepts the relevant cancer pathway |

NHS data has real reporting gaps. Some trusts don't publish certain metrics. The algorithm handles missing data gracefully rather than excluding trusts with incomplete reporting.

### The Letter Generator

Once a patient selects a trust, Claude generates a structured GP transfer request letter that:
- References the patient's right to choose under the NHS Constitution
- Cites specific wait time comparisons between current and target trust
- Includes the target trust's details
- Uses formal but accessible language a GP will take seriously

## Data

Wait time data sourced from [NHS England Cancer Waiting Times](https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/) monthly statistics.

| Standard | What it measures |
|----------|-----------------|
| FDS (28-day) | Faster Diagnosis Standard -- time from referral to diagnosis |
| 31-day | Time from decision to treat to first treatment |
| 62-day | Time from urgent GP referral to first treatment |

Covers breast, lung, colorectal, and prostate pathways across 20+ London trusts.

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | Next.js 16 (App Router, React 19) | Full-stack with API routes, SSR, Turbopack |
| Styling | Tailwind CSS 4 | Custom ClearPath design system (lime/mint/purple palette) |
| Maps | Leaflet / react-leaflet | Interactive trust map with colour-coded markers |
| Letter generation | Anthropic Claude | Structured, formal GP letter writing |
| Chat | Groq (Llama 3.3) | Fast inference for patient Q&A |
| Deployment | Vercel | Auto-deploy on push |

## Install

```bash
git clone https://github.com/rexheng/Inform.git
cd Inform
npm install
npm run dev
```

Create `.env.local`:

```
GROQ_API_KEY=your_groq_key
# Optional -- letter generation uses mock fallback without this:
# ANTHROPIC_API_KEY=your_anthropic_key
```

## Project Structure

```
src/
  app/
    page.tsx              # Homepage -- choose patient flow or map
    patient/page.tsx      # Patient journey (lookup > compare > letter)
    map/page.tsx          # Interactive trust map
    map/trust/[code]/     # Trust detail page
    api/chat/route.ts     # Streaming chat (Anthropic + Groq fallback)
    api/generate/route.ts # Letter generation (Claude + mock fallback)
    api/search/route.ts   # Hospital search with postcode geocoding
  components/             # PatientLookup, WaitComparison, LetterGenerator, RightsPanel
  map/components/         # ResultsMap, TrustMap, ChatWidget, ResultCard
  lib/                    # NHS data, types, Claude integration, postcodes
data/
  trusts.json             # 20+ London NHS trusts with wait times by cancer type
```

## The Build

Two-person team. Open-ended hackathon with the brief "build something cool and useful that helps people." We wanted to build for the individual patient side of health inequality, complementing [Outreach](https://github.com/rexheng/Outreach) which addresses the policy and resource allocation side.

The harder challenge was the algorithm. Weighting by location, wait time, urgency, and availability simultaneously, while handling NHS data gaps that forced workarounds for incomplete reporting.

## Hackathon

- **Event**: LSE Claude Builder Club Hackathon
- **Date**: March 2026
- **Team**: [Rex Heng](https://linkedin.com/in/rexheng), [Nicolas Amman](https://linkedin.com/in/nicolas-amman)

## Licence

NHS waiting time data is Crown Copyright, used under the Open Government Licence.
