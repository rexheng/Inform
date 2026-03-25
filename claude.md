# Inform — Cancer Wait Time Search Platform

## Project Overview
NHS cancer waiting times search tool for London. Patients search by cancer type + postcode, get ranked list of trusts by wait time and distance.

## Stack
- **Backend:** Python 3.12+ / FastAPI / SQLAlchemy / PostgreSQL
- **Frontend:** React 18 + TypeScript / Vite / TailwindCSS
- **AI Chat:** Groq API (Llama 3.3 70B) via SSE streaming
- **Data:** NHS England Cancer Waiting Times CSVs (monthly, public)

## Conventions
- Backend code in `backend/app/`, entry point `backend/app/main.py`
- Frontend code in `frontend/src/`
- Database migrations via Alembic in `backend/alembic/`
- ETL pipeline in `backend/app/etl/`
- API routes in `backend/app/routers/`
- Business logic in `backend/app/services/`
- Vercel serverless functions in `api/` (root level)

## Architecture
- Split-panel layout: left panel (search + results), right panel (Leaflet map)
- Local dev: Vite proxies `/api` to FastAPI at `localhost:8000`
- Production: Vercel serves frontend SPA; rewrites proxy `/api/*` to backend on Railway

## Deployment

### Frontend (Vercel)
- Auto-deploys from `master` branch
- `vercel.json` rewrites `/api/:path*` to the Railway backend URL
- SPA catch-all rewrite for client-side routing
- Set `VITE_API_URL` in Vercel env vars if not using rewrites

### Backend (Railway)
- Deploy `backend/` directory to Railway
- Railway auto-detects Python via `requirements.txt` or `pyproject.toml`
- Start command in `Procfile`: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Required env vars:
  - `INFORM_DATABASE_URL` — PostgreSQL connection string (Railway provides this)
  - `INFORM_CORS_ORIGINS` — JSON array of allowed origins (include Vercel domain)
- After first deploy, run ETL to seed data: `python -m app.etl.run`

### Environment Variables
- Backend: see `backend/.env.example`
- Frontend: see `frontend/.env.example`

## Data Notes
- NHS CSV URL pattern: `https://www.england.nhs.uk/statistics/wp-content/uploads/sites/2/{year}/{month}/{MonthName}-{Year}-Monthly-Combined-CSV-Provisional.csv`
- CSV has no metadata header rows — header is row 1
- Standards: FDS (28-day Faster Diagnosis), 31D (31-day), 62D (62-day)
- Filter by `Basis="Provider"` and `Parent_Org="London"` for London trusts
- 23 London trusts in the dataset
- For ranking, use `ALL ROUTES` and `ALL MODALITIES` aggregates

## Chat Feature
- Backend: `backend/app/routers/chat.py` (local dev via FastAPI)
- Vercel: `api/chat.ts` (production serverless function)
- Frontend: `ChatWidget.tsx` + `useChat.ts` hook
- API key: `INFORM_GROQ_API_KEY` in backend `.env`, `GROQ_API_KEY` in Vercel env vars
- System prompt includes NHS domain knowledge; search context injected when available

## Testing
- Backend: `pytest` from `backend/` directory
- Frontend: `npm run build` (type check + bundle) from `frontend/` directory
