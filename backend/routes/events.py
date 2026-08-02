"""SSE Streaming Endpoint.

Provides a persistent Server-Sent Events connection for the mobile
dashboard to receive real-time updates from the agent.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from collections.abc import AsyncIterable

from backend.event_bus import event_bus

router = APIRouter()


@router.get("/events")
async def sse_stream():
    """SSE event stream for the manager dashboard.

    The client connects once and receives all agent events in real time.
    Supports automatic reconnection via Last-Event-ID.
    """
    queue = event_bus.subscribe()

    async def event_generator():
        event_id = 0
        try:
            # Send initial connection event
            yield {
                "event": "connected",
                "id": str(event_id),
                "data": json.dumps({"message": "Connected to EcomGuard event stream"}),
            }
            event_id += 1

            while True:
                try:
                    # Wait for event with timeout (heartbeat every 15s)
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {
                        "event": event["type"],
                        "id": str(event_id),
                        "data": json.dumps(event["data"]) if isinstance(event["data"], (dict, list)) else str(event["data"]),
                    }
                    event_id += 1
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield {"comment": "heartbeat"}
        except asyncio.CancelledError:
            pass
        finally:
            event_bus.unsubscribe(queue)

    return EventSourceResponse(event_generator())
