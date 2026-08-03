"""Action Management Routes.

Handles action approval, rejection, execution, and results.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from backend.state import app_state
from backend.event_bus import event_bus
from backend.agent.actions import execute_approved_actions

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.get("/proposed")
async def get_proposed_actions() -> dict[str, Any]:
    """Get all proposed actions pending approval."""
    return {
        "actions": app_state.proposed_actions,
        "total": len(app_state.proposed_actions),
    }


@router.post("/{action_id}/approve")
async def approve_action(action_id: str) -> dict[str, str]:
    """Approve a single proposed action."""
    for action in app_state.proposed_actions:
        if action["id"] == action_id:
            action["status"] = "approved"
            await event_bus.publish("action_approved", {"action_id": action_id})
            return {"status": "approved", "action_id": action_id}
    raise HTTPException(status_code=404, detail=f"Action {action_id} not found")


@router.post("/{action_id}/reject")
async def reject_action(action_id: str) -> dict[str, str]:
    """Reject a single proposed action."""
    for action in app_state.proposed_actions:
        if action["id"] == action_id:
            action["status"] = "rejected"
            await event_bus.publish("action_rejected", {"action_id": action_id})
            return {"status": "rejected", "action_id": action_id}
    raise HTTPException(status_code=404, detail=f"Action {action_id} not found")


@router.post("/approve-all")
async def approve_all_actions() -> dict[str, Any]:
    """Approve all pending actions at once."""
    approved_count = 0
    for action in app_state.proposed_actions:
        if action.get("status") == "pending":
            action["status"] = "approved"
            approved_count += 1
            await event_bus.publish("action_approved", {"action_id": action["id"]})
    await event_bus.publish("all_actions_approved", {"count": approved_count})
    return {"status": "all_approved", "count": approved_count}


@router.post("/execute")
async def execute_actions(background_tasks: BackgroundTasks) -> dict[str, Any]:
    """Execute all approved actions sequentially."""
    approved = [a for a in app_state.proposed_actions if a.get("status") == "approved"]
    if not approved:
        raise HTTPException(status_code=400, detail="No approved actions to execute")

    background_tasks.add_task(execute_approved_actions)
    return {"status": "execution_started", "actions_to_execute": len(approved)}


@router.get("/results")
async def get_results() -> dict[str, Any]:
    """Get execution results for all actions."""
    return {
        "results": app_state.executed_actions,
        "total": len(app_state.executed_actions),
    }
