# Inform — Cancer Wait Time Search Platform

## Problem
NHS cancer patients in London face significant wait times with no easy way to compare providers. Patients lack visibility into how different trusts perform for their specific cancer type.

## Solution
A search platform that surfaces publicly available NHS Cancer Waiting Times data. Users enter their cancer type and postcode, and receive a ranked list of London trusts scored by wait time performance and distance.

## How It Works
1. User selects a cancer type and enters their postcode
2. System filters London trusts treating that cancer type
3. Geocodes the postcode via postcodes.io
4. Calculates distance to each trust
5. Scores trusts: `score = (0.7 × wait_time_norm) + (0.3 × distance_norm)` (lower = better)
6. Returns ranked results with compliance rates, distance, and trends

## Data Source
NHS England Cancer Waiting Times statistics — published monthly at england.nhs.uk. Three standards tracked:
- **28-Day Faster Diagnosis Standard (FDS):** % diagnosed within 28 days of referral
- **31-Day Standard:** % receiving first treatment within 31 days of decision to treat
- **62-Day Standard:** % receiving first treatment within 62 days of urgent referral

## Architecture
- **Backend:** FastAPI + PostgreSQL
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **ETL:** Monthly CSV download → parse → load pipeline
- **Deployment:** Docker Compose (API + DB + Frontend)

## London Trusts (23)
Data covers all NHS trusts in the London region, including major cancer centres like The Royal Marsden, UCLH, Guy's and St Thomas', and King's College Hospital.
