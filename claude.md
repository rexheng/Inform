# Inform — Cancer Wait Time Search Platform

## Project Overview
NHS cancer waiting times search tool for London. Patients search by cancer type + postcode, get ranked list of trusts by wait time and distance.

## Stack
- **Backend:** Python 3.12+ / FastAPI / SQLAlchemy / PostgreSQL
- **Frontend:** React 18 + TypeScript / Vite / TailwindCSS
- **Data:** NHS England Cancer Waiting Times CSVs (monthly, public)

## Conventions
- Backend code in `backend/app/`, entry point `backend/app/main.py`
- Frontend code in `frontend/src/`
- Database migrations via Alembic in `backend/alembic/`
- ETL pipeline in `backend/app/etl/`
- API routes in `backend/app/routers/`
- Business logic in `backend/app/services/`

## Data Notes
- NHS CSV URL pattern: `https://www.england.nhs.uk/statistics/wp-content/uploads/sites/2/{year}/{month}/{MonthName}-{Year}-Monthly-Combined-CSV-Provisional.csv`
- CSV has no metadata header rows — header is row 1
- Standards: FDS (28-day Faster Diagnosis), 31D (31-day), 62D (62-day)
- Filter by `Basis="Provider"` and `Parent_Org="London"` for London trusts
- 23 London trusts in the dataset
- For ranking, use `ALL ROUTES` and `ALL MODALITIES` aggregates

## Testing
- Backend: `pytest` from `backend/` directory
- Frontend: `npm test` from `frontend/` directory
