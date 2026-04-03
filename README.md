# ClearPath — Find Shorter NHS Cancer Waiting Times

ClearPath helps NHS cancer patients discover shorter waiting times at nearby London trusts and exercise their legal right to choose where they receive care.

**Live:** [inform-eight.vercel.app](https://inform-eight.vercel.app)

## What it does

- **Patient flow** — Enter your hospital, cancer type, and postcode. ClearPath finds nearby trusts with shorter waits, compares them side-by-side, and generates a GP transfer request letter you can print or copy.
- **Map explorer** — Browse all 20+ London NHS trusts on an interactive map. Colour-coded wait times by cancer type, with detailed trust pages showing diagnosis, treatment, and referral-to-treatment metrics.
- **AI chat assistant** — Context-aware chat on the map page that answers questions about wait times, hospital comparisons, and general cancer information using NHS data.

## Tech stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **Tailwind CSS 4** with ClearPath design system
- **Leaflet / react-leaflet** for interactive maps
- **Anthropic Claude** (letter generation) + **Groq Llama** (chat fallback)
- **Vercel** for deployment

## Getting started

```bash
npm install
npm run dev
```

Create `.env.local` with:

```
GROQ_API_KEY=your_groq_key
# Optional — letter generation uses mock fallback without this:
# ANTHROPIC_API_KEY=your_anthropic_key
```

## Project structure

```
src/
  app/
    page.tsx              # Homepage — choose patient flow or map
    patient/page.tsx      # Patient journey (lookup → compare → letter)
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

## Data

Wait time data sourced from [NHS England Cancer Waiting Times](https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/) monthly statistics. Covers FDS (28-day), 31-day, and 62-day standards across breast, lung, colorectal, and prostate pathways.

## Deployment

Deployed on Vercel. Push to `master` triggers auto-deploy. Environment variable `GROQ_API_KEY` must be set in Vercel project settings for chat to work.

---

Built at the LSE Claude Builder Club Hackathon, March 2026.
