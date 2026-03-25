from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import search, providers, stats

app = FastAPI(
    title="Inform API",
    description="NHS Cancer Wait Time Search API for London",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api")
app.include_router(providers.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
