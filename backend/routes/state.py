"""State and Reset Routes.

Provides full state snapshot and system reset functionality.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from backend.state import app_state
from backend.event_bus import event_bus

router = APIRouter(prefix="/api", tags=["state"])


@router.get("/state")
async def get_state() -> dict[str, Any]:
    """Get full dashboard state snapshot."""
    return app_state.snapshot()


@router.post("/reset")
async def reset_system() -> dict[str, str]:
    """Reset entire system to initial state.

    Clears all reviews, agent state, actions, and returns every
    data source to its pristine condition. Completes within 3 seconds.
    """
    app_state.reset()
    await event_bus.publish("reset", {"message": "System reset to initial state"})
    return {"status": "reset_complete"}


@router.get("/outcome")
async def get_outcome() -> dict[str, Any]:
    """Get the outcome report with before/after metrics."""
    if app_state.outcome_report is None:
        return {"outcome_report": None, "status": "not_generated"}
    return {
        "outcome_report": app_state.outcome_report,
        "status": "generated",
    }
