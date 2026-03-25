# NHS GP Wait Times — APIs, Data Sources & Key Information

## Overview

This document catalogues every significant API, dataset, and data source relevant to building an app that helps users find GP practices with shorter wait times and better access. Sources are ranked by relevance and grouped by function.

---

## 1. CRITICAL APIs (Real-Time / Near-Real-Time)

### 1.1 Organisation Data Terminology — FHIR R4 API (RECOMMENDED for ODS)
- **URL:** Production: `https://api.service.nhs.uk/organisation-data-terminology-api/fhir`
- **Sandbox:** `https://sandbox.api.service.nhs.uk/organisation-data-terminology-api/fhir`
- **What it does:** Full ODS dataset via FHIR R4: GP practice codes, names, addresses (incl. UPRN), postcodes, contact details, roles, open/close dates, active status, successor/predecessor relationships, geographic boundaries (LSOA, ICB, LA, NHS Region, Parliamentary Constituency). Also GP practitioner data.
- **Access:** Application-restricted (API key). Register at NHS Developer Hub. No end-user auth needed.
- **Format:** FHIR R4 JSON (`application/fhir+json`) or XML
- **Rate limits:** 5,000 requests per 5 minutes. HTTP 429 if exceeded.
- **Service level:** Platinum (24/7/365)
- **Key endpoints:**
  - `GET /Organization` (search) — filter by `roleCode=RO76` for GP practices
  - `GET /Organization/{odsCode}` (single lookup)
  - `GET /OrganizationAffiliation` (relationships: practice→PCN→ICB)
- **Status:** Active, production. **This is the recommended API** — replaces retired FHIR STU3 and soon-to-be-retired ORD API (Sep 2026).
- **Why it matters:** Programmatic access to the master GP practice reference with richer data than CSV exports.

### 1.2 Directory of Healthcare Services (Service Search) API v3
- **URL:** Production: `https://api.service.nhs.uk/service-search-api`
- **What it does:** Search for GPs, pharmacies, urgent care centres, dentists, hospitals by postcode/location. Returns opening hours, services offered, contact details, lat/long. Supports `geo.distance()` proximity search.
- **Access:** API key — register at https://developer.api.nhs.uk/. Production requires Online Connection Agreement.
- **Format:** JSON (REST, OData filtering)
- **Rate limits:** Production: 4,000 req/hour. Integration: 1,500 req/week, 1 req/sec max.
- **Auth:** API key in header
- **Status:** v1/v2 deprecated Feb 2026 — **must use v3**
- **Why it matters:** Core location search engine for the app. This is how you find "GPs near me" and alternative care options.

### 1.3 Booking and Referral Standard (BaRS) — FHIR API
- **URL:** https://digital.nhs.uk/developer/api-catalogue/booking-and-referral-fhir
- **What it does:** Modern replacement for NHS Booking FHIR API. Cross-setting booking and referral (111→ED, 111→GP hubs). Uses FHIR UK Core R4.
- **Access:** **RESTRICTED** — requires HSCN connection + NHS onboarding
- **Format:** JSON (FHIR R4)
- **Why it matters:** The newest booking standard. Would give real-time slot availability, but access is tightly controlled.

### 1.4 GP Connect Appointment Management FHIR API
- **URL:** https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir
- **What it does:** Search free slots, book, read, amend, cancel appointments at specific GP practices
- **Access:** **RESTRICTED** — requires HSCN connection, Spine Secure Proxy auth, JSON Web Token per request, local RBAC, Clinical Safety Officer (DCB0129/DCB0160), approved use case submission. Development must start within 6 months of approval.
- **Format:** JSON (FHIR STU3) over Spine Secure Proxy
- **Service level:** Silver (24/7 operational, support Mon-Fri 8am-6pm)
- **Why it matters:** Direct practice-level real-time appointment data. Extremely powerful but requires significant onboarding. Not for public/research use.

### 1.4 Register with a GP Surgery API
- **URL:** https://digital.nhs.uk/developer/api-catalogue/register-with-a-gp-surgery
- **What it does:** Enables online GP registration
- **Access:** Restricted — NHS onboarding
- **Why it matters:** Enables in-app registration flow when users find a better practice.

---

## 2. OPEN DATA — Appointment & Wait Time Statistics

### 2.1 Appointments in General Practice (Monthly Publication)
- **URL:** https://digital.nhs.uk/data-and-information/publications/statistical/appointments-in-general-practice
- **What it does:** Monthly CSVs of appointment activity at practice level
- **Access:** **FULLY OPEN** — direct CSV download, no registration
- **Format:** CSV
- **Update:** Monthly
- **Coverage:** ~98.9% of GP practices
- **Key fields:**
  - `PRAC_CODE` — practice ODS code
  - `APPT_STATUS` — attended, DNA, cancelled
  - `TIME_BETWEEN_BOOK_AND_APPT` — **this is your wait time proxy** (same day, 1 day, 2-7 days, 8-14 days, 15-21 days, 22-28 days, 28+ days)
  - `APPT_MODE` — face-to-face, telephone, home visit, online
  - `HCP_TYPE` — GP, nurse, other
  - `NATIONAL_CATEGORY` — general consultation, clinical triage, etc.
- **Why it matters:** **Primary dataset for the app.** The "time between booking and appointment" field is the closest public proxy for wait times.

### 2.2 GP Patient Survey (GPPS)
- **URL:** https://www.england.nhs.uk/statistics/statistical-work-areas/gp-patient-survey/
- **Download:** https://gp-patient.co.uk/latest-survey/results
- **What it does:** Annual survey (~800k respondents) measuring patient experience
- **Access:** **FULLY OPEN** — download Excel/CSV from gp-patient.co.uk
- **Format:** Excel, CSV, PowerPoint
- **Update:** Annual (published July)
- **Key fields:**
  - Ease of getting through on the phone (%)
  - Satisfaction with appointment times available (%)
  - Ease of getting appointment (%)
  - Overall experience of GP practice (%)
  - Online services awareness/usage
- **Why it matters:** Subjective but powerful — tells you which practices patients feel are easy/hard to access.

### 2.3 GP Appointment Data (GPAD) Dashboard
- **URL:** https://www.england.nhs.uk/gp/gpad/
- **Access:** **RESTRICTED** — NHS Smartcard only (not publicly accessible)
- **Why it matters:** Contains richer appointment detail than the public publication. Worth knowing about but not directly usable for a public app.

---

## 3. OPEN DATA — Practice Reference & Location

### 3.1 ODS GP Practice Data (via Data Search & Export)
- **URL:** https://digital.nhs.uk/services/organisation-data-service/data-search-and-export/csv-downloads/gp-and-gp-practice-related-data
- **Search tool:** https://www.odsdatasearchandexport.nhs.uk/
- **What it does:** Master reference file of all GP practices: address, postcode, phone, status, parent ICB
- **Access:** **FULLY OPEN** — direct CSV download
- **Format:** CSV
- **Update:** Daily (2am refresh)
- **Key fields:** Practice code, name, full address, postcode, phone, status (active/closed), ICB code, open/close dates
- **Why it matters:** Core reference table — every other dataset joins to this via practice ODS code.

### 3.2 Patients Registered at a GP Practice
- **URL:** https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice
- **Access:** **FULLY OPEN** — CSV download
- **Update:** Monthly
- **Key fields:** Practice code, total patients, age/sex breakdown, PCN, ICB
- **Why it matters:** Combined with workforce data, gives you **patients per GP** — a key capacity metric.

---

## 4. OPEN DATA — Workforce & Capacity

### 4.1 General Practice Workforce
- **URL:** https://digital.nhs.uk/data-and-information/publications/statistical/general-and-personal-medical-services
- **Access:** **FULLY OPEN** — CSV download
- **Update:** Monthly
- **Key fields:** Practice code, GP FTE, nurse FTE, DPC FTE, admin FTE, headcount by staff group
- **Why it matters:** Supply-side data. **Patients-per-GP-FTE** is one of the strongest predictors of wait times.

---

## 5. OPEN DATA — Quality & Inspection

### 5.1 CQC Ratings & Inspection Data
- **URL:** https://www.cqc.org.uk/about-us/transparency/using-cqc-data
- **API base:** `https://api.service.cqc.org.uk`
- **API docs:** Register and download JSON files from CQC developer portal
- **Contact:** syndicationapi@cqc.org.uk
- **Access:** Open download (CSV) + API (free registration)
- **Format:** CSV (bulk) + JSON (API)
- **Update:** Monthly
- **Licence:** Open Government Licence
- **Key fields:** CQC location ID, overall rating, 5 key question ratings, inspection date
- **Why it matters:** Quality signal — users may prefer a slightly longer wait at a "Good" rated practice over a shorter wait at "Requires Improvement".

---

## 6. OPEN DATA — Population Health & Context

### 6.1 OHID Fingertips — National GP Profiles
- **URL:** https://fingertips.phe.org.uk/profile/general-practice
- **API docs:** https://fingertips.phe.org.uk/profile/guidance/supporting-information/api
- **R package:** https://docs.ropensci.org/fingertipsR/
- **Access:** **FULLY OPEN** — API (JSON/CSV) + download
- **Format:** JSON, CSV
- **Key fields:** 150+ indicators per practice — deprivation, life expectancy, QOF achievement, disease prevalence, cancer screening rates, patient satisfaction
- **Why it matters:** Disease prevalence predicts appointment demand. Practices with higher chronic disease burden will have structurally longer waits.

### 6.2 English Indices of Deprivation (IMD) 2025
- **URL:** https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025
- **Quick lookup:** https://imd-by-postcode.opendatacommunities.org/
- **Access:** **FULLY OPEN** — CSV/Excel download
- **Granularity:** LSOA-level (32,844 areas in England)
- **Key fields:** LSOA code, IMD score, rank, decile, 7 domain scores
- **Why it matters:** Deprivation correlates strongly with both health need and GP access difficulty.

### 6.3 ONS Postcode Directory (ONSPD)
- **URL:** https://geoportal.statistics.gov.uk/
- **Access:** **FULLY OPEN** — CSV download
- **Update:** Quarterly
- **Key fields:** Postcode → LSOA, MSOA, local authority, ward, lat/long, rural/urban classification
- **Why it matters:** Essential glue table — converts practice postcodes to LSOA codes for joining with IMD, census, and other geographic data.

---

## 7. SUPPLEMENTARY DATA

### 7.1 English Prescribing Data (EPD)
- **URL:** https://opendata.nhsbsa.net/dataset/english-prescribing-data-epd
- **Access:** **FULLY OPEN** — CSV from NHSBSA Open Data Portal
- **Update:** Monthly
- **Why it matters:** Prescribing volume as a proxy for practice workload.

### 7.2 OpenPrescribing.net
- **URL:** https://openprescribing.net/
- **API docs:** https://openprescribing.net/api/
- **Access:** **FULLY OPEN** — JSON API + CSV
- **Why it matters:** Pre-processed prescribing analytics with practice comparisons.

---

## 8. DEVELOPER PORTALS & REGISTRATION

| Portal | URL | Purpose |
|--------|-----|---------|
| NHS England API Catalogue | https://digital.nhs.uk/developer/api-catalogue | Central index of all NHS APIs |
| NHS Developer Portal | https://developer.api.nhs.uk/ | API key registration for NHS website APIs |
| NHS Developer Community | https://developer.community.nhs.uk/ | Forum for API questions |
| ODS Data Search & Export | https://www.odsdatasearchandexport.nhs.uk/ | Organisation reference data |
| CQC Developer Portal | https://api.service.cqc.org.uk | CQC ratings API |
| NHSBSA Open Data Portal | https://opendata.nhsbsa.net/ | Prescribing data |
| ONS Open Geography Portal | https://geoportal.statistics.gov.uk/ | Postcode/geography lookups |
| OHID Fingertips API | https://fingertips.phe.org.uk/profile/guidance/supporting-information/api | Public health indicators |

---

## 9. RECOMMENDED DATA ARCHITECTURE FOR APP

### Tier 1 — Core (Must Have)
| # | Dataset | Purpose |
|---|---------|---------|
| 1 | ODS GP Practice Data | Practice master reference (location, contact, status) |
| 2 | Appointments in General Practice | Wait time proxy (booking-to-appointment interval) |
| 3 | Patients Registered | Demand metric (list size) |
| 4 | General Practice Workforce | Supply metric (GP FTE) |
| 5 | Service Search API v3 | Real-time location search + alternative care options |

### Tier 2 — Enrichment (Should Have)
| # | Dataset | Purpose |
|---|---------|---------|
| 6 | GP Patient Survey | Subjective access experience ratings |
| 7 | CQC Ratings | Quality signal |
| 8 | ONS Postcode Directory | Geographic linkage |
| 9 | IMD 2025 | Deprivation context |
| 10 | GP Practice Catchment Area KML | "Am I in catchment?" feature |
| 11 | TfL PTAL / Journey Planner API | Travel-time-weighted recommendations (London) |
| 12 | QOF Data | Disease prevalence → demand prediction |

### Tier 3 — Advanced (Nice to Have)
| # | Dataset | Purpose |
|---|---------|---------|
| 13 | Fingertips GP Profiles | 150+ population health indicators |
| 14 | Prescribing Data | Workload proxy |
| 15 | NHS 111 IUC ADC Data | GP overflow demand signal |
| 16 | Consolidated Pharmaceutical List | Pharmacy alternatives |
| 17 | NHS Booking API / BaRS | Real-time slots (if access granted) |
| 18 | LSOA Boundary Shapefiles | Choropleth mapping |

### Key Join Strategy
```
Practice ODS Code ← universal key across ALL NHS datasets
Practice Postcode → ONSPD → LSOA → IMD/Census/Deprivation/PTAL/Boundaries
CQC Location ID ↔ ODS Code (linkable via CQC download)
ODS FHIR R4 API returns LSOA directly (no postcode lookup needed)
Catchment KML → ODS code embedded in KML data
```

---

## 10. KEY COMPUTED METRICS FOR THE APP

Using the datasets above, you can compute:

| Metric | Formula | Data Sources |
|--------|---------|--------------|
| **Patients per GP** | Registered patients / GP FTE | Patients Registered + Workforce |
| **% appointments waited 14+ days** | Count(14+ days) / Total appointments | Appointments in GP |
| **Same-day appointment rate** | Count(same day) / Total | Appointments in GP |
| **DNA rate** | Count(DNA) / Total | Appointments in GP |
| **Patient satisfaction score** | Composite of GPPS questions | GP Patient Survey |
| **Capacity stress index** | Weighted: patients/GP + wait % + satisfaction | Multiple |
| **Deprivation-adjusted wait** | Wait metric adjusted for IMD decile | Appointments + IMD |

---

## 11. TRANSPORT & ACCESSIBILITY DATA

### 11.1 TfL PTAL Data (London Only)
- **URL:** https://gis-tfl.opendata.arcgis.com/datasets/0646faf45243463aa04ca685e598f471
- **LSOA aggregated:** https://gis-tfl.opendata.arcgis.com/datasets/3eb38b75667a49df9ef1240e9a197615
- **London Datastore:** https://data.london.gov.uk/dataset/public-transport-accessibility-levels-24rz6/
- **What it does:** PTAL scores (0 to 6b) for every 100m grid cell in Greater London, based on walk time to stops, service frequency, reliability. Also pre-aggregated at LSOA level.
- **Access:** **FULLY OPEN** — download from TfL GIS Open Data Hub
- **Format:** Shapefile, GeoJSON, CSV
- **Why it matters:** Enables travel-time-weighted GP recommendations — a practice 10 mins away by tube is better than one 10 mins away with no public transport.

### 11.2 TfL Journey Planner API
- **URL:** https://api-portal.tfl.gov.uk/
- **What it does:** Point-to-point journey planning across all London transport modes. Calculates actual travel times.
- **Access:** Free API key registration
- **Coverage:** London only
- **Why it matters:** Calculate real travel time from user's location to each nearby GP practice.

### 11.3 DfT Journey Time Statistics (National, Discontinued)
- **URL:** https://www.gov.uk/government/collections/journey-time-statistics
- **What it does:** Pre-computed LSOA-level travel times to GP surgeries by public transport, walking, cycling, car. % population reaching GP within 15/30 mins.
- **Access:** **FULLY OPEN** — Excel/ODS download
- **Status:** **DISCONTINUED** March 2025. Latest data is 2019. Still useful as a baseline.

---

## 12. CATCHMENT AREAS & BOUNDARIES

### 12.1 GP Practice Catchment Area KML Files
- **URL:** https://data.england.nhs.uk/dataset/gp-practice-submitted-inner-catchment-area-kml-file
- **Viewer:** https://nhs-gp-catchment.scwcsu.nhs.uk/catchment-embed/?odscode={ODS_CODE}
- **What it does:** Boundary polygons showing each GP practice's catchment area, submitted via eDEC annual collection.
- **Access:** **FULLY OPEN** — KML download from NHS England Data Catalogue
- **Format:** KML (compatible with Google Earth, QGIS, Leaflet, Mapbox)
- **Why it matters:** Essential for answering "can I register at this practice?" — users need to know if they live within catchment.

### 12.2 ONS LSOA Boundary Shapefiles (2021)
- **URL:** https://geoportal.statistics.gov.uk/datasets/ons::lower-layer-super-output-areas-december-2021-boundaries-ew-bsc-v4-2/about
- **Access:** **FULLY OPEN** — Shapefile, GeoJSON, KML, WMS, WFS
- **Why it matters:** Essential for choropleth maps showing wait times, deprivation, capacity by area.

---

## 13. NHS 111 & URGENT CARE OVERFLOW DATA

### 13.1 Integrated Urgent Care Aggregate Data (IUC ADC)
- **URL:** https://www.england.nhs.uk/statistics/statistical-work-areas/iucadc-new-from-april-2021/
- **What it does:** 111 call volumes, dispositions (recommended to primary care, A&E, ambulance), call answer times, abandonment rates.
- **Access:** **FULLY OPEN** — CSV/Excel download
- **Update:** Monthly (provisional ~2 weeks; official ~2 months)
- **Granularity:** NHS 111 contract area (~ICB level)
- **Why it matters:** High "recommended to primary care" volume is a proxy signal for GP capacity stress in an area.

### 13.2 Consolidated Pharmaceutical List (Pharmacies)
- **URL:** https://opendata.nhsbsa.net/dataset/consolidated-pharmaceutical-list
- **What it does:** All NHS community pharmacies: ODS code, name, address, postcode, LPC area.
- **Access:** **FULLY OPEN** — CSV + CKAN API from NHSBSA
- **Update:** Quarterly
- **Why it matters:** Pharmacies handle minor ailments — app can redirect users from overloaded GPs.

---

## 14. OPEN SOURCE TOOLS & PRIOR ART

| Project | URL | What it does |
|---------|-----|-------------|
| NHS Wait Times Explorer | https://github.com/N-Garner/NHS-wait-times-explorer | Maps GP appointment waits by ICB |
| Elective Waiting Times Pipeline | https://github.com/HFAnalyticsLab/Elective-waiting-times-pipeline | R pipeline scraping/analysing RTT data by deprivation |
| NHS BNSSG Analytics | https://github.com/nhs-bnssg-analytics | Waitlist compartment models, demand/capacity prediction |
| House of Commons QOF Data | https://github.com/houseofcommonslibrary/local-health-data-from-QOF | Local health condition prevalence from QOF |
| fingertips_py | https://github.com/dhsc-govuk/fingertips_py | Python wrapper for Fingertips API |
| fingertipsR | https://docs.ropensci.org/fingertipsR/ | R package for Fingertips API |
| cqcr | https://github.com/evanodell/cqcr | R wrapper for CQC API |
| NHSRpopulation | https://github.com/nhs-r-community/NHSRpopulation | R package: postcode→LSOA→IMD lookups |

### Key Research Finding: AI Triage
**Rapid Health AI Triage** (NHS-funded evaluation) achieved:
- 73% reduction in GP wait times (11 days → 3 days)
- 91% auto-booking rate
- 47% fewer peak calls
- Zero clinical incidents

Since Oct 2025, all GP practices must offer online consultations all day. Cloud-based telephony in 5,800+ practices increased patient reachability by ~30%.

---

## 15. IMPORTANT MIGRATION NOTES (March 2026)

- `developer.nhs.uk` and associated FHIR servers **decommissioned 2 March 2026**
- ODS FHIR STU3 API is **retired**
- ODS ORD API is **deprecated** (retirement: September 2026)
- Service Search API v1/v2 **deprecated** February 2026
- All new development should use:
  - **Organisation Data Terminology FHIR R4 API** on `api.service.nhs.uk`
  - **Service Search API v3** on `api.service.nhs.uk`
  - **BaRS FHIR API** (replaces NHS Booking FHIR API)

---

## 16. LICENSING

All datasets marked "FULLY OPEN" are published under the **Open Government Licence v3.0**, which permits:
- Copying, publishing, distributing, transmitting
- Adapting
- Exploiting commercially and non-commercially

**Condition:** Acknowledge the source (e.g., "Contains NHS England data" / "Contains CQC data" / "Contains ONS data").

**Restricted APIs** (BaRS, GP Connect) require formal onboarding through NHS England's digital services team.

---

## 17. SOURCES

- [NHS England Digital API Catalogue](https://digital.nhs.uk/developer/api-catalogue)
- [NHS Developer Portal](https://developer.api.nhs.uk/)
- [Appointments in General Practice](https://digital.nhs.uk/data-and-information/publications/statistical/appointments-in-general-practice)
- [GP Patient Survey](https://www.england.nhs.uk/statistics/statistical-work-areas/gp-patient-survey/)
- [GP Patient Survey Results](https://gp-patient.co.uk/latest-survey/results)
- [Patients Registered at a GP Practice](https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice)
- [General Practice Workforce](https://digital.nhs.uk/data-and-information/publications/statistical/general-and-personal-medical-services)
- [ODS Data Search & Export](https://digital.nhs.uk/services/organisation-data-service/data-search-and-export/csv-downloads/gp-and-gp-practice-related-data)
- [Directory of Healthcare Services API](https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services)
- [NHS Booking FHIR API](https://digital.nhs.uk/developer/api-catalogue/nhs-booking-fhir)
- [GP Connect Appointment Management](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
- [CQC Data Downloads](https://www.cqc.org.uk/about-us/transparency/using-cqc-data)
- [OHID Fingertips GP Profiles](https://fingertips.phe.org.uk/profile/general-practice)
- [English Indices of Deprivation 2025](https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025)
- [ONS Open Geography Portal](https://geoportal.statistics.gov.uk/)
- [NHSBSA Open Data Portal](https://opendata.nhsbsa.net/)
- [OpenPrescribing](https://openprescribing.net/)
- [NHS England Data Catalogue](https://data.england.nhs.uk/)
- [NHS Hack Day Datasets & APIs](https://nhshackday.com/resources/datasets-and-apis)
- [GP Practice Data Hub](https://digital.nhs.uk/data-and-information/data-tools-and-services/data-services/general-practice-data-hub)
- [House of Commons Library — GPs by Constituency](https://commonslibrary.parliament.uk/constituency-data-gps-and-gp-practices/)
- [NHS-R Community NHSRpopulation Package](https://github.com/nhs-r-community/NHSRpopulation)
- [Organisation Data Terminology FHIR R4 API](https://digital.nhs.uk/developer/api-catalogue/organisation-data-terminology)
- [ODS ORD API (deprecated)](https://digital.nhs.uk/developer/api-catalogue/organisation-data-service-ord)
- [Booking and Referral Standard (BaRS)](https://digital.nhs.uk/developer/api-catalogue/booking-and-referral-fhir)
- [QOF Online Database](https://qof.digital.nhs.uk/)
- [GP Practice Catchment Area KML Files](https://data.england.nhs.uk/dataset/gp-practice-submitted-inner-catchment-area-kml-file)
- [TfL PTAL Data](https://gis-tfl.opendata.arcgis.com/datasets/0646faf45243463aa04ca685e598f471)
- [TfL Journey Planner API](https://api-portal.tfl.gov.uk/)
- [DfT Journey Time Statistics](https://www.gov.uk/government/collections/journey-time-statistics)
- [Consolidated Pharmaceutical List (NHSBSA)](https://opendata.nhsbsa.net/dataset/consolidated-pharmaceutical-list)
- [IUC ADC / NHS 111 Statistics](https://www.england.nhs.uk/statistics/statistical-work-areas/iucadc-new-from-april-2021/)
- [LSOA Boundary Shapefiles](https://geoportal.statistics.gov.uk/datasets/ons::lower-layer-super-output-areas-december-2021-boundaries-ew-bsc-v4-2/about)
- [ICB Access to GP Dashboard](https://digital.nhs.uk/dashboards/icb-access-to-general-practice-dashboard)
- [Health Foundation GP Dashboard](https://www.health.org.uk/reports-and-analysis/analysis/general-practice-data-dashboard)
- [NHS Wait Times Explorer (GitHub)](https://github.com/N-Garner/NHS-wait-times-explorer)
- [fingertips_py (Python)](https://github.com/dhsc-govuk/fingertips_py)
- [Rapid Health AI Triage Study](https://integratedcarejournal.com/nhs-backed-study-shows-73-reduction-gp-waiting-times-ai-triage/)
- [NHS Developer Community Forum](https://developer.community.nhs.uk/)
- [BMA GP Pressures Analysis](https://www.bma.org.uk/advice-and-support/nhs-delivery-and-workforce/pressures/pressures-in-general-practice-data-analysis)
