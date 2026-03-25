# London Cancer Waiting Times: Data Sources & Extraction Guide

## Geographic Scope

London has 5 Integrated Care Boards (ICBs) and approximately 20 acute trusts delivering cancer services. From April 2026, North Central and North West London ICBs merge into West and North London ICB.

| ICB | Key acute trusts |
|---|---|
| North Central London | UCLH, Royal Free, Whittington, North Mid |
| North East London | Barts Health, Homerton, Barking/Havering/Redbridge |
| North West London | Imperial, Chelsea & Westminster, Hillingdon, London North West |
| South East London | Guy's & St Thomas', King's College, Lewisham & Greenwich |
| South West London | St George's, Epsom & St Helier, Croydon, Kingston |

---

## Dataset 1: Cancer Waiting Times (CWT)

**Source:** NHS England Statistics
**URL:** https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/

| Field | Detail |
|---|---|
| Content | Monthly performance against Faster Diagnosis Standard (28-day), 31-day treatment standard, 62-day treatment standard |
| Granularity | National, ICB, sub-ICB, provider (trust) |
| Breakdowns | Cancer type, treatment modality, pathway outcome, route classification |
| Format | XLSX workbooks; combined CSV files (25-61MB) |
| Time span | October 2009 — present |
| Update frequency | Monthly (provisional, then finalised per revisions policy) |
| Access | Fully open, no registration |
| London extraction | Filter provider-based CSVs by London trust org codes; filter commissioner-based CSVs by London ICB codes |
| Key files | Monthly combined CSV (provider), Monthly combined CSV (commissioner), National time series with revisions |

---

## Dataset 2: Fingertips Cancer Services Profiles

**Source:** Office for Health Improvement and Disparities (OHID)
**URL:** https://fingertips.phe.org.uk/profile/cancerservices

| Field | Detail |
|---|---|
| Content | Cancer incidence, screening uptake (bowel, breast, cervical), urgent suspected cancer referrals, diagnostics |
| Granularity | GP practice, Primary Care Network (PCN), sub-ICB, ICB, national |
| Format | CSV download via web UI; programmatic access via Fingertips API (R package `fingertipsR`, Python package `fingertips_py`) |
| Access | Fully open |
| London extraction | Filter by area codes for London ICBs/sub-ICBs; or pull all GP practices within London postcodes |
| Join key | Organisation code (GP practice code, sub-ICB code, ICB code) |

---

## Dataset 3: Cancer Registration Statistics

**Source:** National Disease Registration Service (NDRS)
**URL:** https://digital.nhs.uk/ndrs/data/data-outputs/cancer-data-hub

| Field | Detail |
|---|---|
| Content | Cancer incidence, prevalence, survival rates, stage at diagnosis |
| Granularity | Cancer Alliance, ICB, Local Authority |
| Format | CSV / Excel via Cancer Data Hub |
| Access | Open for aggregated statistics; patient-level data requires NHS Secure Data Environment (TRE) application |
| London extraction | Filter by London Cancer Alliance codes or London ICB codes |
| Join key | ICB code, Cancer Alliance code |
| Note | Stage-at-diagnosis data is critical context — high late-stage presentation combined with poor FDS performance indicates systemic pathway failure |

---

## Dataset 4: Cancer Outcomes and Services Dataset (COSD)

**Source:** NDRS
**URL:** https://digital.nhs.uk/ndrs/data/data-sets/cosd

| Field | Detail |
|---|---|
| Content | Individual-level cancer records — demographics, tumour characteristics, treatment details, outcomes |
| Granularity | Patient-level |
| Format | Structured dataset within TRE |
| Access | Restricted — requires application via NHS Secure Data Environment or DATA-CAN (data-can.org.uk) |
| London extraction | Filter by treating trust or patient residence (London LSOAs) |
| Join key | Trust org code, LSOA code |
| Note | Not available as open data. Provides demographic breakdowns (age, ethnicity, deprivation) and treatment pathway detail unavailable elsewhere |

---

## Dataset 5: Index of Multiple Deprivation (IMD 2019)

**Source:** Ministry of Housing, Communities & Local Government (MHCLG)
**URL:** https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019

| Field | Detail |
|---|---|
| Content | Deprivation scores and deciles across 7 domains (income, employment, education, health, crime, housing, living environment) |
| Granularity | LSOA (Lower Layer Super Output Area) — 4,994 LSOAs in London |
| Format | CSV / Excel |
| Access | Fully open |
| London extraction | Filter by London local authority district codes or London LSOA codes |
| Join key | LSOA code |
| Note | Requires ONS LSOA-to-trust or LSOA-to-ICB lookup tables to link deprivation to cancer performance geographies |

---

## Dataset 6: NHS Organisation Data Service (ODS)

**Source:** NHS England Digital
**URL:** https://digital.nhs.uk/services/organisation-data-service

| Field | Detail |
|---|---|
| Content | Lookup tables mapping organisation codes to names, types, hierarchies — trust to ICB, ICB to region, GP practice to PCN/sub-ICB |
| Format | CSV |
| Access | Fully open |
| London extraction | Filter by NHS London region or by the 5 London ICB codes |
| Join key | Org code (trust code, ICB code, GP practice code) |
| Note | Essential reference table. All other datasets use org codes as identifiers — ODS provides the human-readable labels and hierarchical relationships |

---

## Dataset 7: Referral to Treatment (RTT) Waiting Times

**Source:** NHS England Statistics
**URL:** https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/

| Field | Detail |
|---|---|
| Content | Consultant-led referral-to-treatment waiting times by trust and treatment function/specialty |
| Granularity | Provider (trust), treatment function |
| Format | CSV / Excel |
| Time span | 2007 — present (monthly) |
| Access | Fully open |
| London extraction | Filter by London trust org codes |
| Join key | Trust org code |
| Note | General waiting time pressure at a trust often correlates with cancer pathway delays — trusts with high RTT backlogs may have shared capacity constraints affecting diagnostics and theatre access |

---

## How Datasets Connect

```
ODS (Dataset 6)
  └── provides org code lookups for all joins below

CWT Provider Data (Dataset 1)
  ├── join on trust org code → ODS for trust-to-ICB mapping
  ├── join on trust org code → RTT (Dataset 7) for capacity context
  └── join on ICB code → Cancer Registration (Dataset 3) for incidence/stage context

CWT Commissioner Data (Dataset 1)
  └── join on ICB code → Fingertips (Dataset 2) for screening/referral upstream data

Fingertips (Dataset 2)
  └── join on sub-ICB/ICB code → IMD (Dataset 5) via ONS geography lookups for deprivation overlay

Cancer Registration (Dataset 3)
  └── join on ICB code → CWT for performance-vs-incidence analysis

IMD (Dataset 5)
  └── join on LSOA code → ONS LSOA-to-ICB lookup → all ICB-level datasets
```

---

## Data Availability Summary

| Dataset | Open access | Format | London-filterable | Update cadence |
|---|---|---|---|---|
| CWT | Yes | CSV, XLSX | By trust/ICB org code | Monthly |
| Fingertips | Yes | CSV, API | By ICB/sub-ICB/GP code | Varies by indicator |
| Cancer Registration | Aggregated: Yes; Patient-level: No | CSV, Excel | By ICB/Cancer Alliance code | Annual |
| COSD | No (TRE only) | Structured | By trust/LSOA | Monthly submission |
| IMD 2019 | Yes | CSV, Excel | By LSOA/LA code | Static (2019 release) |
| ODS | Yes | CSV | By region/ICB | Quarterly |
| RTT | Yes | CSV, Excel | By trust org code | Monthly |

---

## Policy Context

These standards and targets define what the data is measuring against:

| Standard | Target | Current performance (approx.) |
|---|---|---|
| Faster Diagnosis Standard (28-day) | 80% by March 2026 (rising from 75%) | ~77% nationally |
| 31-day treatment | 96% | ~95% nationally |
| 62-day referral to treatment | 85% by end of parliament (interim 75% for 2025/26) | ~70% nationally |

The National Cancer Plan (February 2026) commits to meeting all cancer waiting time standards by March 2029 and achieving 75% five-year survival by 2035.
