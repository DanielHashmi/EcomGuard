"""Review Management Routes.

Handles manual review ingestion, auto-stream control, and
review listing with classification labels.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, Field

from backend.state import app_state
from backend.event_bus import event_bus
from backend.agent.ecomguard_agent import run_investigation

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


class ReviewInput(BaseModel):
    """Manual review input from the manager."""
    text: str
    rating: int  # 1-5
    reviewer: str = "DemoUser"


# Background task handle for auto-stream
_auto_stream_task: asyncio.Task | None = None


def _should_trigger_investigation() -> bool:
    return (
        len(app_state.ingested_reviews) >= 5
        and not app_state.investigation_started
        and not app_state.proposed_actions
        and app_state.agent_status not in {"awaiting_approval", "executing", "resolved"}
    )


@router.get("")
async def list_reviews() -> dict[str, Any]:
    """Get all ingested reviews with classification labels."""
    reviews = []
    for r in app_state.ingested_reviews:
        classification = app_state.review_classifications.get(r["id"], {})
        reviews.append({
            **r,
            "classification": classification.get("label", "unclassified"),
            "classification_reason": classification.get("reason", ""),
        })
    return {
        "reviews": reviews,
        "total": len(reviews),
        "total_available": len(app_state.ds01_reviews.get("reviews", [])),
    }


@router.post("")
async def add_review(review: ReviewInput, background_tasks: BackgroundTasks) -> dict[str, Any]:
    """Add a single review manually (manager demo input)."""
    idx = len(app_state.ingested_reviews) + 1
    all_reviews = app_state.ds01_reviews.get("reviews", [])

    # If there are pre-built reviews left, use the next one's metadata
    if idx <= len(all_reviews):
        pre_built = all_reviews[idx - 1]
        new_review = {**pre_built, "text": review.text, "rating": review.rating, "reviewer": review.reviewer}
    else:
        new_review = {
            "id": f"REV-{idx:03d}",
            "reviewer": review.reviewer,
            "rating": review.rating,
            "date": datetime.now(timezone.utc).isoformat(),
            "purchase_date": "2024-11-27T00:00:00Z",
            "batch": "B2024-11",
            "text": review.text,
        }

    app_state.ingested_reviews.append(new_review)
    await event_bus.publish("review_added", new_review)

    # Auto-trigger investigation after enough reviews
    if _should_trigger_investigation():
        background_tasks.add_task(run_investigation)

    return {"review": new_review, "total_ingested": len(app_state.ingested_reviews)}


@router.post("/auto-stream")
async def start_auto_stream() -> dict[str, Any]:
    """Start auto-streaming pre-built reviews on a timer."""
    global _auto_stream_task

    if app_state.auto_stream_active:
        return {"status": "already_active"}

    app_state.auto_stream_active = True

    async def _stream_reviews():
        all_reviews = app_state.ds01_reviews.get("reviews", [])
        while app_state.auto_stream_active and app_state.auto_stream_index < len(all_reviews):
            review = all_reviews[app_state.auto_stream_index]
            app_state.ingested_reviews.append(review)
            app_state.auto_stream_index += 1

            await event_bus.publish("review_added", review)

            # Delay between reviews (faster for demo)
            await asyncio.sleep(2.0)

        app_state.auto_stream_active = False

        if _should_trigger_investigation():
            asyncio.create_task(run_investigation())

    _auto_stream_task = asyncio.create_task(_stream_reviews())
    return {"status": "started", "total_reviews": len(app_state.ds01_reviews.get("reviews", []))}


@router.post("/stop-stream")
async def stop_auto_stream() -> dict[str, str]:
    """Stop auto-streaming reviews."""
    global _auto_stream_task
    app_state.auto_stream_active = False
    if _auto_stream_task and not _auto_stream_task.done():
        _auto_stream_task.cancel()
    return {"status": "stopped"}
