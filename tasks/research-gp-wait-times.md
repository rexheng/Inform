# Research: Reducing NHS GP Wait Times -- Data Sources, Apps & Projects

**Date:** 2026-03-25

---

## 1. Existing Apps & Digital Tools

### 1.1 NHS App
- **URL:** https://www.nhs.uk/nhs-app/
- **Relevance:** The core national patient-facing platform. Since October 2025, all GP practices in England must offer online consultations during core hours (8am-6:30pm) via the NHS App. Patients can book/cancel appointments, view GP records, request repeat prescriptions.
- **Data:** Shows elective waiting times for referred patients. Cloud-Based Telephony data added to dashboards July 2025. 1.6 million online submissions to Midlands GPs in January 2026 alone (doubled year-on-year).
- **APIs:** Patient Care Aggregator FHIR API provides aggregated referrals/bookings. GP Connect Appointment Management FHIR API enables cross-system appointment management. NOTE: developer.nhs.uk and associated FHIR servers were decommissioned 2 March 2026 -- check for successor platform.

### 1.2 eConsult
- **URL:** https://econsult.net/
- **Relevance:** First online consultation provider integrated with the NHS App. Patients submit structured clinical/administrative requests; practices must respond within one working day.
- **Data/Research:** Phase II evaluation across 11 Scottish GP practices found expectations of alternative GP access were largely met, but self-help promotion was uncertain. Devon/Cornwall evaluation found majority of e-consultations still resulted in face-to-face or phone follow-up. Only 3% of consultations included feedback forms.
- **Access:** No public API. Data generated stays within practice systems (EMIS/TPP).

### 1.3 Accurx
- **URL:** https://www.accurx.com/
- **Relevance:** Forms-based online consultation ("Patient Triage") now live in 1,000+ GP practices covering ~11 million patients. Integrated with NHS App. Explicitly aims to end the "8am phone rush."
- **Data:** No public API or published datasets. Internal data on triage outcomes.
- **Access:** Proprietary; practices access via their clinical systems.

### 1.4 Babylon GP at Hand (now part of eMed)
- **URL:** https://www.babylonhealth.com/
- **Relevance:** Digital-first model where nearly all consultations start via smartphone. Had 100,000+ registered patients in London (August 2021). 85% of patients aged 20-39 vs 28% nationally -- skews young/healthy.
- **Data/Research:** Very little formal published evaluation. Health Foundation noted the model "will not work for everyone." Babylon data was included in NHS appointments datasets until December 2024. The company went through financial difficulties; acquired by eMed.
- **Access:** No public data. Academic critique exists but limited outcome data.

### 1.5 LIVI
- **URL:** https://www.livi.co.uk/
- **Relevance:** Video consultations contracted with GP practice groups, free to NHS patients. Operates as a supplement to in-person care.
- **Data:** No public datasets or APIs. Limited published evaluations.

### 1.6 Push Doctor
- **URL:** https://www.pushdoctor.co.uk/
- **Relevance:** Video consultation platform live with 200+ GP surgeries (2019). NHS-contracted.
- **Data:** No public data. Limited published evaluations. Academic literature notes absence of objective outcome data for all digital GP services.

---

## 2. NHS England Official Datasets (the gold mine)

### 2.1 Appointments in General Practice
- **URL:** https://digital.nhs.uk/data-and-information/publications/statistical/appointments-in-general-practice
- **Relevance:** THE primary dataset for understanding GP demand and access patterns. Monthly publication since 2018.
- **Data fields:** Appointment status (attended/DNA), mode (face-to-face/telephone/video/online), healthcare professional type, time between booking and appointment, consultation duration, appointment category, SDS role group.
- **Granularity:** National > Region > ICB > Sub-ICB > GP Practice level.
- **Access:** Free CSV downloads from each monthly publication page. Data from EMIS, TPP, and other clinical systems. Latest: January 2026 (published March 2026).
- **Key finding:** This is the most directly relevant dataset for modeling wait times and demand patterns.

### 2.2 GP Patient Survey (GPPS)
- **URL:** https://gp-patient.co.uk/ and https://www.england.nhs.uk/statistics/statistical-work-areas/gp-patient-survey/
- **Relevance:** Annual survey of patient experience of GP access -- contacting the practice, quality of care, satisfaction.
- **Data fields:** Overall experience, ease of contact, appointment availability, waiting time satisfaction, continuity of care, digital access usage.
- **Granularity:** National > ICS > PCN > Practice level.
- **Access:** Free CSV/XLSX downloads. 2025 results: 75.4% reported good overall experience (up 1.5pp); 69.6% good contact experience (up 2.3pp).

### 2.3 General Practice Workforce
- **URL:** https://digital.nhs.uk/data-and-information/publications/statistical/general-and-personal-medical-services
- **Dashboard:** https://digital.nhs.uk/data-and-information/data-tools-and-services/data-services/general-practice-data-hub/workforce
- **Relevance:** Critical for understanding supply side -- GP numbers, nurse numbers, admin staff, patients per GP.
- **Data fields:** FTE and headcount by staff group (GPs, Nurses, Direct Patient Care, Admin), gender, role, age band, work commitment.
- **Granularity:** National > ICB > Practice level. Monthly updates.
- **Access:** Interactive Power BI dashboards. Data accessible through GP Data Hub.
- **Key stat (Jan 2026):** 28,814 FTE fully qualified GPs in England -- down 550 since 2015. 6,172 practices (1,451 closed/merged since 2015).

### 2.4 Quality and Outcomes Framework (QOF)
- **URL:** https://qof.digital.nhs.uk/ and https://digital.nhs.uk/data-and-information/publications/statistical/quality-and-outcomes-framework-achievement-prevalence-and-exceptions-data
- **Relevance:** Practice-level disease prevalence, quality indicators, achievement rates. Useful for understanding demand drivers (chronic disease burden).
- **Data fields:** Disease prevalence rates, achievement against clinical indicators, personalised care adjustments. Coverage: 6,188 practices (97.6%), ~63 million patients.
- **Granularity:** National > Region > ICB > Sub-ICB > Practice level.
- **Access:** Free CSV downloads (MAPPING_INDICATORS.csv + raw data files). Online database for practice comparisons.

### 2.5 GP Practice List Size and Demographics
- **URL:** https://www.nhsbsa.nhs.uk/prescription-data/organisation-data/practice-list-size-and-gp-count-each-practice
- **Also:** https://digital.nhs.uk/services/organisation-data-service/data-search-and-export/csv-downloads/gp-and-gp-practice-related-data
- **Relevance:** Number of registered patients per practice, split by demographics. Essential denominator for all per-capita calculations.
- **Data fields:** Patient list size, prescribing vs dispensing patients, GP count per practice.
- **Granularity:** Practice level. Monthly updates. Single CSV download.
- **Access:** Free. ODS Data Search and Export (nightly updates).

### 2.6 General Practice Data Hub (umbrella)
- **URL:** https://digital.nhs.uk/data-and-information/data-tools-and-services/data-services/general-practice-data-hub
- **Relevance:** Central portal aggregating 11 dashboards: Patient Registration, Workforce, QOF, Appointments, Prescribing, Dementia, NHS Health Checks, Fit Notes, Dentistry, Learning Disabilities, Cervical Screening.
- **Access:** Free interactive dashboards. The Access to General Practice Data Hub sub-section is the most relevant.

### 2.7 ICB Access to General Practice Dashboard
- **URL:** https://digital.nhs.uk/dashboards/icb-access-to-general-practice-dashboard
- **Relevance:** Combines GP appointments data with Cloud-Based Telephony data (added July 2025). Shows access patterns at ICB level. New NHS 111 metric added December 2025 (% calls during GP core hours).
- **Access:** Free. Interactive dashboard.

---

## 3. OHID/PHE Fingertips Data

### 3.1 National General Practice Profiles
- **URL:** https://fingertips.phe.org.uk/profile/general-practice
- **Relevance:** 150+ practice-level indicators covering population health, deprivation, patient satisfaction, QOF, cancer services, child health, antibiotic prescribing.
- **Granularity:** Practice level, Sub-ICB, ICB, Local Authority.
- **Access methods:**
  - Web interface: https://fingertips.phe.org.uk/
  - REST API: Base URL `https://fingertipsws.phe.org.uk/` (JSON or CSV output)
  - Python: `fingertips_py` package (https://github.com/dhsc-govuk/fingertips_py)
  - R: `fingertipsR` package (https://docs.ropensci.org/fingertipsR/)
- **Key indicators relevant to GP access:** Patient satisfaction, disease prevalence, deprivation scores, life expectancy, health inequalities.

---

## 4. Academic Research & Specialist Datasets

### 4.1 Clinical Practice Research Datalink (CPRD)
- **URL:** https://www.cprd.com/
- **Relevance:** The premier UK primary care research database. 60 million patient records, 16 million currently registered. Linked to hospital, mortality, deprivation data. Powers major GP workload/demand studies.
- **Access:** Approved researchers only. Cost-recovery basis: ~GBP 15,000 for feasibility study data. Multi-study annual licence available. Rigorous governance process.
- **Key study:** 2016 analysis of 100 million GP consultations provided first substantial evidence of increasing GP clinical workload in England.

### 4.2 GP Working Time and Supply Study (BJGP 2024)
- **URL:** https://bjgp.org/content/74/747/e666
- **Relevance:** Retrospective study 2015-2022 using practice-level data. Multi-level Poisson models assessing associations between GP supply and practice demand (patient numbers, older patients, chronic conditions).
- **Access:** Published open-access research paper. Methodology replicable with publicly available NHS datasets.

### 4.3 ONS GP Access Experience Surveys
- **URL:** https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthcaresystem
- **Relevance:** Regular surveys on public experiences of GP practice access and NHS waiting times.
- **Access:** Free CSV downloads from ONS website.

### 4.4 Waiting List Minimum Dataset (WLMDS)
- **URL:** https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/wlmds/
- **Relevance:** Weekly data on elective care demand, activity, and waiting lists. Published alongside monthly RTT data from April 2024.
- **Access:** Free download from NHS England statistics.

---

## 5. NHS Digital Transformation & APIs

### 5.1 GP Connect APIs (FHIR)
- **Appointment Management:** https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir
- **Access Record (Structured):** https://digital.nhs.uk/developer/api-catalogue/gp-connect-access-record-structured-fhir
- **Access Record (HTML):** https://digital.nhs.uk/developer/api-catalogue/gp-connect-access-record-html-fhir
- **Relevance:** FHIR STU3 APIs enabling cross-system appointment management and patient record access. Used by authorised health/social care workers.
- **Status:** Production. NOTE: developer.nhs.uk decommissioned 2 March 2026; check successor platform.
- **Access:** Requires NHS onboarding, Spine connection, clinical safety approval. Not for public/hackathon use without NHS partnership.

### 5.2 Booking and Referral Standard (BaRS)
- **URL:** https://digital.nhs.uk/developer/api-catalogue (search for BaRS)
- **Relevance:** Emerging standard for booking/referral flows between NHS services. Future direction for GP appointment interoperability.
- **Status:** In development/early adoption.

### 5.3 NHS API Catalogue
- **URL:** https://digital.nhs.uk/developer/api-catalogue
- **Relevance:** 183+ APIs across NHS services. Includes booking, referrals, patient records, prescriptions.
- **Status:** Mixed (production, beta, alpha). Digital blueprint expected 2026.

### 5.4 2026 Digital & Data Blueprint
- **Context:** NHS 10 Year Health Plan sets priorities for digital transformation. 100% EPR coverage target by March 2026. Aligned strategic approach to primary care + community health data by March 2026. 70% of trusts expected at core digitisation level by March 2026.
- **Implication:** New APIs and data sharing standards likely to emerge. Monitor NHS England digital publications.

---

## 6. Open Source Tools & Hackathon Projects

### 6.1 Rapid Health -- Smart Triage (AI Triage)
- **URL:** https://www.rapidhealth.ai/primary-care
- **Relevance:** THE standout case study. NHS-funded evaluation at The Groves Medical Centre (Surrey) showed:
  - **73% reduction** in wait times (11 days to 3 days)
  - **47% fewer** peak-hour phone calls
  - **91%** of appointments auto-booked without staff intervention
  - **50% longer** consultations (10 min to 15 min)
  - **8% more** appointments per day without additional staff
  - **Zero** clinical incidents during evaluation
- **Evaluation by:** Unity Insights, funded by Health Innovation Kent Surrey Sussex.
- **Access:** Commercial product, not open source. But the evaluation methodology and results are published.

### 6.2 NHS Wait Times Explorer
- **URL:** https://github.com/N-Garner/NHS-wait-times-explorer / https://n-garner.github.io/NHS-wait-times-explorer/
- **Relevance:** Open source tool mapping routine GP appointment waits (days) and elective RTT waits (weeks) by ICB and Trust. Enables searching/comparing primary care access across England.
- **Tech:** Web-based visualization.
- **Access:** Fully open source on GitHub.

### 6.3 Elective Waiting Times Pipeline (Health Foundation Analytics Lab)
- **URL:** https://github.com/HFAnalyticsLab/Elective-waiting-times-pipeline
- **Relevance:** Automated pipeline to web-scrape and analyze NHS England RTT waiting times data. Produces summary stats at provider/CCG level, stratified by deprivation (IMD 2019), region, provider type.
- **Tech:** R (tidyverse, data.table, rvest, RSelenium).
- **Access:** Fully open source on GitHub.

### 6.4 NHS BNSSG Analytics
- **URL:** https://github.com/nhs-bnssg-analytics
- **Relevance:** NHS Bristol, North Somerset and South Gloucestershire ICB analytics team. Repositories include waitlist multi-compartment models and prediction from demand/capacity metrics.
- **Tech:** R-based.
- **Access:** Open source on GitHub.

### 6.5 House of Commons Library -- QOF Health Data
- **URL:** https://github.com/houseofcommonslibrary/local-health-data-from-QOF
- **Relevance:** Code and data for producing health condition prevalence from NHS Digital QOF data at local authority level.
- **Tech:** R.
- **Access:** Fully open source.

### 6.6 NHS Hack Days
- **URL:** https://nhshackday.com/
- **Relevance:** Run 3-4 times per year since ~2012. Past projects have tackled GP access, including a winning project on "how to better use technology to improve access to GP services and reduce the 8am burden." An Alexa skill for hospital waiting times was also developed.
- **Access:** Event-based. Some project code on GitHub but not consistently archived.

---

## 7. Summary: Top Datasets for a GP Wait Time Reduction Project

| # | Dataset | Granularity | Format | Update | Cost | Priority |
|---|---------|------------|--------|--------|------|----------|
| 1 | **Appointments in General Practice** | Practice | CSV | Monthly | Free | CRITICAL |
| 2 | **GP Workforce** | Practice | Dashboard/Data | Monthly | Free | CRITICAL |
| 3 | **GP Patient Survey** | Practice | CSV/XLSX | Annual | Free | HIGH |
| 4 | **QOF (disease burden)** | Practice | CSV | Annual | Free | HIGH |
| 5 | **Practice List Size** | Practice | CSV | Monthly | Free | HIGH |
| 6 | **Fingertips GP Profiles** | Practice | API/CSV | Varies | Free | HIGH |
| 7 | **ICB Access Dashboard** | ICB | Dashboard | Monthly | Free | MEDIUM |
| 8 | **ONS GP Access Survey** | National/Regional | CSV | Periodic | Free | MEDIUM |
| 9 | **CPRD** | Patient | Restricted | Daily | ~GBP15k+ | LOW (cost) |
| 10 | **WLMDS** | Provider | CSV | Weekly | Free | MEDIUM |

---

## 8. Key Approaches That Have Worked

1. **AI Triage (Rapid Health):** Autonomous patient navigation + auto-booking. 73% wait reduction, 91% auto-allocation. The most impactful proven intervention.
2. **Online Consultation Mandates:** Since October 2025, all GP practices must offer online consultations all day. 1.6M monthly submissions in Midlands alone.
3. **Cloud-Based Telephony:** 5,800+ practices. Increased ability to reach practice by ~30%.
4. **Digital-First Models:** Babylon GP at Hand showed rapid access but skewed young/healthy. Not a universal solution.
5. **Demand Modeling:** BJGP 2024 study demonstrated practice-level Poisson models linking GP supply to demand factors. Replicable with public data.

---

## 9. Recommended Next Steps

1. **Download and explore** the Appointments in General Practice CSV data (practice-level, monthly since 2018)
2. **Cross-link** with GP Workforce data (FTE per practice) and Practice List Size (patients per practice) to compute patients-per-GP and appointments-per-GP ratios
3. **Layer in** QOF disease prevalence and Fingertips deprivation/demographics for demand modeling
4. **Use GP Patient Survey** data as an outcome measure (satisfaction with access)
5. **Explore** fingertips_py Python package for programmatic access to 150+ practice-level indicators
6. **Study the Rapid Health evaluation** methodology for evidence-based intervention design
7. **Monitor** the NHS 2026 Digital & Data Blueprint for new API opportunities
