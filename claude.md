# London Cancer Waiting Times: Feasibility & Key Datasets

## Scope

A London-focused analytics tool that enables commissioners, researchers, and clinicians to interrogate cancer waiting time performance across London's 5 ICBs and ~20 acute trusts — identifying where delays cluster, why, and what interventions would have the greatest impact.

---

## Why London?

- **5 ICBs** (merging to 4 from April 2026): North Central, North East, North West, South East, South West London
- **~20 acute trusts** providing cancer services — wide variation in performance
- **Dense, diverse population** — meaningful health inequalities by borough
- **Cancer Alliances** already producing local dashboards (e.g. South East London Cancer Alliance) — but no unified London view
- **Policy tailwind**: National Cancer Plan (Feb 2026) commits to meeting all waiting time standards by March 2029; ICB restructuring creates demand for new data tools

---

## What's Feasible with Open Data Alone

| Capability | Feasible? | Data source |
|---|---|---|
| Monthly CWT performance by London trust | Yes | NHS England CWT provider CSVs |
| Monthly CWT performance by London ICB | Yes | NHS England CWT commissioner CSVs |
| Breakdown by cancer type (per trust) | Yes | Provider-based data includes cancer type |
| Breakdown by pathway stage (FDS, 31-day, 62-day) | Yes | Separate metrics per standard |
| Time series analysis (2009-present) | Yes | National time series with revisions |
| Cross-trust benchmarking within London | Yes | Filter provider data to London trusts |
| Cancer incidence by ICB | Yes | NDRS cancer registration statistics |
| Screening uptake by GP practice / sub-ICB | Yes | Fingertips Cancer Services profiles |
| Referral volumes and diagnostic outcomes | Yes | FDS pathway outcome data |
| Deprivation overlay (IMD by LSOA) | Yes | MHCLG IMD 2019 + ONS lookups |
| 62-day backlog tracking | Yes | NHS England management information |
| Demographic breakdown (age, ethnicity) | No | Requires COSD via TRE access |
| Patient-level pathway analysis | No | Requires COSD/NDRS via TRE |
| Treatment modality detail | Partial | High-level in CWT; detail in COSD |

---

## Key Datasets

### 1. Cancer Waiting Times (CWT) — NHS England Statistics

**URL:** https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/

- **What:** Monthly performance against FDS (28-day), 31-day, and 62-day standards
- **Granularity:** National, ICB, sub-ICB, provider (trust)
- **Breakdowns:** Cancer type, treatment modality, pathway outcome, route classification
- **Format:** XLSX workbooks, CSV (25-61MB combined files)
- **Time span:** October 2009 — present (monthly)
- **Access:** Fully open, no registration required
- **London filter:** ~20 provider codes (trust-level), 5 ICB codes (commissioner-level)
- **Update frequency:** Monthly (provisional → finalised)

### 2. Fingertips Cancer Services Profiles — OHID

**URL:** https://fingertips.phe.org.uk/profile/cancerservices

- **What:** Cancer incidence, screening uptake, urgent referrals, diagnostics
- **Granularity:** GP practice, PCN, sub-ICB, ICB, national
- **Format:** CSV download or programmatic access via Fingertips API (R/Python)
- **Access:** Fully open
- **London value:** Practice-level screening data exposes within-ICB variation — e.g. which GP clusters under-refer

### 3. Cancer Registration Statistics — NDRS

**URL:** https://digital.nhs.uk/ndrs/data/data-outputs/cancer-data-hub

- **What:** Cancer incidence, prevalence, survival, stage at diagnosis
- **Granularity:** Cancer Alliance, ICB, Local Authority
- **Format:** CSV / Excel via Cancer Data Hub
- **Access:** Open (aggregated); patient-level via NHS Secure Data Environment (TRE)
- **London value:** Incidence and stage-at-diagnosis data contextualises waiting time performance — high late-stage presentation + poor FDS = systemic pathway failure

### 4. Cancer Outcomes and Services Dataset (COSD) — NDRS

**URL:** https://digital.nhs.uk/ndrs/data/data-sets/cosd

- **What:** The national standard for individual-level cancer data — demographics, tumour characteristics, treatment, outcomes
- **Granularity:** Patient-level
- **Access:** Restricted — requires application via NHS Secure Data Environment or DATA-CAN
- **London value:** The gold standard for deep analysis (demographics, treatment pathways, outcomes by ethnicity/deprivation). Not needed for MVP but essential for Phase 2

### 5. Index of Multiple Deprivation (IMD 2019) — MHCLG

**URL:** https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019

- **What:** Deprivation scores and deciles for every LSOA in England
- **Granularity:** LSOA (Lower Layer Super Output Area)
- **Format:** CSV / Excel
- **Access:** Fully open
- **London value:** Overlay deprivation on cancer performance to expose health inequalities — e.g. do trusts serving more deprived populations have worse 62-day performance?

### 6. NHS Organisation Data — ODS

**URL:** https://digital.nhs.uk/services/organisation-data-service

- **What:** Lookup tables mapping trust codes to ICBs, Cancer Alliances, regions
- **Format:** CSV
- **Access:** Fully open
- **London value:** Essential for filtering national CWT data down to London providers and mapping organisational relationships

### 7. NHS Referral to Treatment (RTT) Waiting Times

**URL:** https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/

- **What:** Consultant-led RTT waiting times by trust and specialty
- **Granularity:** Provider, treatment function
- **Access:** Fully open
- **London value:** Cross-reference general waiting times with cancer-specific data — trusts with high RTT backlogs may have capacity constraints spilling into cancer pathways

---

## London ICBs & Key Trusts

| ICB | Key acute trusts (cancer) |
|---|---|
| **North Central London** | UCLH, Royal Free, Whittington, North Mid |
| **North East London** | Barts Health, Homerton, Barking/Havering/Redbridge |
| **North West London** | Imperial, Chelsea & Westminster, Hillingdon, London North West |
| **South East London** | Guy's & St Thomas', King's College, Lewisham & Greenwich |
| **South West London** | St George's, Epsom & St Helier, Croydon, Kingston |

**Note:** From April 2026, North Central and North West London ICBs merge into **West and North London ICB**. The tool should handle this transition.

---

## Existing Products & How We Differ

| Product | What it does | Gap we fill |
|---|---|---|
| **Cancer 360** (NHS FDP) | Patient-level operational tracking within a trust | We do population-level analytics *across* trusts |
| **AuguR** (Leeds/Yorkshire) | Open-source cancer analytics for Yorkshire | We do London specifically, with national comparison |
| **Nuffield Trust dashboard** | High-level national performance summary | We drill into pathway stage, cancer type, trust drivers |
| **Fingertips** | Indicator-level profiles, no narrative | We build interactive exploration with context and comparison |
| **South East London Cancer Alliance dashboard** | Single alliance view | We unify all 5 London ICBs into one tool |

---

## Policy Context

| Policy | Date | Relevance |
|---|---|---|
| **National Cancer Plan** | Feb 2026 | First 10-year strategy since 2015. 75% 5-year survival by 2035. All waiting time standards met by March 2029 |
| **FDS target increase** | March 2026 | Faster Diagnosis Standard rising from 75% to 80% |
| **62-day target** | 2025/26 | Operational target of 75% (currently ~70% nationally) |
| **NHS Reset** | Oct 2025 | 190K more patients treated within 2 months over 3 years |
| **ICB restructuring** | April 2026 | NCL + NWL merge — creates data continuity challenge and demand for new tools |
| **CWT system migration** | 2026 | Entire data collection platform moving — window of opportunity |

---

## Proposed MVP (Open Data Only)

**Core features:**
1. London CWT dashboard — filterable by ICB, trust, cancer type, time period
2. Pathway stage drilldown — where in the FDS/31-day/62-day pipeline do delays concentrate?
3. Trust benchmarking — rank London trusts against each other and national median
4. Trend analysis — 2009-present time series with COVID impact visible
5. Deprivation overlay — IMD decile correlation with performance metrics
6. Screening-to-referral pipeline — Fingertips data showing upstream GP-level variation

**Tech:**
- Static site (Next.js or similar) with pre-processed data
- Python ETL pipeline pulling monthly CWT CSVs + Fingertips API
- No backend needed for MVP — all open data, pre-aggregated

**Data refresh:** Monthly, aligned with NHS England publication schedule

---

## Phase 2 (Requires Data Access Application)

- COSD patient-level analysis via NHS Secure Data Environment
- Demographic breakdowns (age, ethnicity, deprivation)
- Treatment pathway analysis
- Survival outcome correlation with waiting times
- Partnership with DATA-CAN for research-grade access
