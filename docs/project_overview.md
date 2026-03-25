# Inform — Cancer Wait Time Search Platform

## Problem
NHS cancer patients in London face significant wait times with no easy way to compare providers. Patients lack visibility into how different trusts perform for their specific cancer type.

## Solution
A search platform that surfaces publicly available NHS Cancer Waiting Times data. Users enter their cancer type and postcode (or use GPS), and receive a ranked list of London trusts scored by wait time performance and distance. An AI chatbot provides contextual help interpreting the results.

## How It Works
1. User selects a cancer type and enters their postcode (or uses GPS location)
2. System filters London trusts treating that cancer type
3. Geocodes the postcode via postcodes.io
4. Calculates distance to each trust
5. Scores trusts: `score = (0.7 x wait_time_norm) + (0.3 x distance_norm)` (lower = better)
6. Returns ranked results with compliance rates, distance, and actionable links
7. AI chatbot available to explain results, standards, and answer questions

## Data Source
NHS England Cancer Waiting Times statistics — published monthly at england.nhs.uk. Three standards tracked:
- **28-Day Faster Diagnosis Standard (FDS):** % diagnosed within 28 days of referral
- **31-Day Standard:** % receiving first treatment within 31 days of decision to treat
- **62-Day Standard:** % receiving first treatment within 62 days of urgent referral

## Architecture
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL (local dev only)
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **AI Chat:** Groq API (Llama 3.3 70B) with SSE streaming
- **ETL:** Monthly CSV download, parse, load pipeline
- **Deployment:** Vercel (static SPA + serverless chat function)

## London Trusts (23)
Data covers all NHS trusts in the London region, including major cancer centres like The Royal Marsden, UCLH, Guy's and St Thomas', and King's College Hospital.
