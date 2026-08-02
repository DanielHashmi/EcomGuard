"""EcomGuard Backend — FastAPI Application Entry Point.

Autonomous Product Crisis Intelligence Agent.
Provides REST API + SSE streaming for the manager's mobile dashboard.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routes import events, reviews, agent, actions, state

app = FastAPI(
    title="EcomGuard API",
    description="Autonomous Product Crisis Intelligence Agent — Manager Dashboard Backend",
    version="1.0.0",
)

# CORS for the Expo mobile client (dev + Expo Go)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(events.router)
app.include_router(reviews.router)
app.include_router(agent.router)
app.include_router(actions.router)
app.include_router(state.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "EcomGuard",
        "status": "running",
        "version": "1.0.0",
        "business": settings.business_name,
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "provider": settings.active_provider,
        "model": settings.active_model,
        "port": settings.port,
    }
