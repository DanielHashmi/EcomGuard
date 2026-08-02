"""Async SSE Event Bus for real-time dashboard updates.

Each subscriber gets its own asyncio.Queue. Events are published
to all active subscribers simultaneously.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any


class EventBus:
    """Simple publish/subscribe event bus for SSE streaming."""

    def __init__(self) -> None:
        self._subscribers: list[asyncio.Queue] = []

    async def publish(self, event_type: str, data: Any) -> None:
        """Publish an event to all subscribers."""
        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        dead_queues = []
        for queue in self._subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                dead_queues.append(queue)

        # Clean up dead/full queues
        for q in dead_queues:
            self._subscribers.remove(q)

    def subscribe(self) -> asyncio.Queue:
        """Create a new subscriber queue."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=500)
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Remove a subscriber queue."""
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)


# Singleton event bus
event_bus = EventBus()
