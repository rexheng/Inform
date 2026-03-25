# Inform — Implementation Progress

## Step 0: Project Setup & Documentation
- [x] Create docs/project_overview.md
- [x] Update claude.md with project conventions
- [x] Create tasks/todo.md and tasks/lessons.md

## Step 1: Backend Scaffold
- [x] pyproject.toml with dependencies
- [x] FastAPI app structure (main, config, database, models)
- [x] Alembic migrations setup

## Step 2: ETL Pipeline
- [x] London trusts reference data
- [x] NHS CSV downloader
- [x] CSV parser
- [x] Database loader
- [x] CLI runner

## Step 3: API Endpoints
- [x] /api/search — ranked results
- [x] /api/providers — list/detail
- [x] /api/cancer-types — dropdown data
- [x] /api/stats/summary — aggregates
- [x] /api/etl/refresh — manual refresh
- [x] Geocoding service (postcodes.io)
- [x] Ranking engine

## Step 4: Frontend Scaffold
- [x] Vite + React + TypeScript + TailwindCSS

## Step 5: Frontend Pages
- [x] Search/landing page with split-panel layout
- [x] Results list with ranked cards
- [x] Provider detail page
- [x] Interactive Leaflet map
- [x] API client hooks (useSearch, useCancerTypes, useProvider)
- [x] GPS location support

## Step 6: AI Chat Integration
- [x] Backend chat router (FastAPI + Groq/Llama)
- [x] Vercel serverless function (api/chat.ts)
- [x] useChat hook with SSE streaming
- [x] ChatWidget component (collapsible, map overlay)
- [x] Search context passed to LLM

## Step 7: Deployment
- [x] Vercel deployment (frontend SPA + serverless functions)
- [x] Vite proxy for local development
