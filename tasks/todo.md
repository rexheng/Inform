# Inform — Implementation Progress

## Step 0: Project Setup & Documentation
- [x] Create docs/project_overview.md
- [x] Update claude.md with project conventions
- [x] Create tasks/todo.md and tasks/lessons.md

## Step 1: Backend Scaffold
- [ ] pyproject.toml with dependencies
- [ ] FastAPI app structure (main, config, database, models)
- [ ] Alembic migrations setup
- [ ] Docker Compose (API + PostgreSQL)

## Step 2: ETL Pipeline
- [ ] London trusts reference data
- [ ] NHS CSV downloader
- [ ] CSV parser
- [ ] Database loader
- [ ] CLI runner

## Step 3: API Endpoints
- [ ] /api/search — ranked results
- [ ] /api/providers — list/detail
- [ ] /api/cancer-types — dropdown data
- [ ] /api/stats/summary — aggregates
- [ ] /api/etl/refresh — manual refresh
- [ ] Geocoding service (postcodes.io)
- [ ] Ranking engine

## Step 4: Frontend Scaffold
- [ ] Vite + React + TypeScript + TailwindCSS

## Step 5: Frontend Pages
- [ ] Search/landing page
- [ ] Results page
- [ ] Provider detail page
- [ ] API client hooks

## Step 6: Integration & Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] SEO basics

## Step 7: Deployment
- [ ] Dockerize frontend
- [ ] Full Docker Compose
- [ ] Seed database
- [ ] Health checks
