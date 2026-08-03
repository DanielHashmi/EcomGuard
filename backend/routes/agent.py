"""Agent Control Routes.

Provides endpoints for agent status, investigation trigger,
and reasoning/contradiction retrieval.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, BackgroundTasks

from backend.state import app_state
from backend.agent.ecomguard_agent import run_investigation

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.get("/status")
async def get_status() -> dict[str, Any]:
    """Get current agent operational status."""
    return {
        "status": app_state.agent_status,
        "investigation_started": app_state.investigation_started,
        "crisis_detected": app_state.crisis_detected,
        "reviews_ingested": len(app_state.ingested_reviews),
        "reasoning_entries": len(app_state.reasoning_log),
        "contradictions_found": len(app_state.contradictions),
        "actions_proposed": len(app_state.proposed_actions),
    }


@router.post("/investigate")
async def trigger_investigation(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Manually trigger agent investigation (normally autonomous)."""
    if app_state.investigation_started:
        return {"status": "already_in_progress"}

    background_tasks.add_task(run_investigation)
    return {"status": "investigation_started"}


@router.get("/reasoning")
async def get_reasoning_log() -> dict[str, Any]:
    """Get the full agent reasoning log."""
    return {
        "reasoning_log": app_state.reasoning_log,
        "total": len(app_state.reasoning_log),
    }


@router.get("/contradictions")
async def get_contradictions() -> dict[str, Any]:
    """Get all discovered contradictions."""
    return {
        "contradictions": app_state.contradictions,
        "total": len(app_state.contradictions),
    }
