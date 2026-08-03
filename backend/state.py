"""EcomGuard In-Memory Application State.

No database needed for demo scope. All state lives here and is
reset completely on POST /api/reset.
"""

from __future__ import annotations

import copy
import json
import csv
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent / "data"


def _load_json(filename: str) -> dict:
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_csv(filename: str) -> list[dict]:
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ---------------------------------------------------------------------------
# Initial data snapshots (loaded once, deep-copied on reset)
# ---------------------------------------------------------------------------
_INITIAL_DS01 = _load_json("ds01_reviews.json")
_INITIAL_DS02 = _load_csv("ds02_sales_returns.csv")
_INITIAL_DS03 = _load_json("ds03_supplier_report.json")
_INITIAL_DS04 = _load_json("ds04_warehouse_inventory.json")
_INITIAL_DS05 = _load_json("ds05_market_news.json")


@dataclass
class AppState:
    """Complete application state — mutable, in-memory."""

    # Agent operational status
    agent_status: str = "monitoring"  # monitoring | investigating | awaiting_approval | executing | resolved

    # Data sources (mutable copies)
    ds01_reviews: dict = field(default_factory=dict)
    ds02_sales: list[dict] = field(default_factory=list)
    ds03_supplier: dict = field(default_factory=dict)
    ds04_warehouse: dict = field(default_factory=dict)
    ds05_news: dict = field(default_factory=dict)

    # Reviews ingested so far (for incremental demo feed)
    ingested_reviews: list[dict] = field(default_factory=list)
    review_classifications: dict[str, dict] = field(default_factory=dict)

    # Agent reasoning log
    reasoning_log: list[dict] = field(default_factory=list)

    # Contradictions discovered
    contradictions: list[dict] = field(default_factory=list)

    # Proposed actions (pending manager approval)
    proposed_actions: list[dict] = field(default_factory=list)

    # Executed action results
    executed_actions: list[dict] = field(default_factory=list)

    # Outcome report
    outcome_report: dict | None = None

    # Flags
    crisis_detected: bool = False
    investigation_started: bool = False
    auto_stream_active: bool = False
    auto_stream_index: int = 0

    def reset(self) -> None:
        """Reset to pristine initial state."""
        self.agent_status = "monitoring"
        self.ds01_reviews = copy.deepcopy(_INITIAL_DS01)
        self.ds02_sales = copy.deepcopy(_INITIAL_DS02)
        self.ds03_supplier = copy.deepcopy(_INITIAL_DS03)
        self.ds04_warehouse = copy.deepcopy(_INITIAL_DS04)
        self.ds05_news = copy.deepcopy(_INITIAL_DS05)
        self.ingested_reviews = []
        self.review_classifications = {}
        self.reasoning_log = []
        self.contradictions = []
        self.proposed_actions = []
        self.executed_actions = []
        self.outcome_report = None
        self.crisis_detected = False
        self.investigation_started = False
        self.auto_stream_active = False
        self.auto_stream_index = 0

    def snapshot(self) -> dict[str, Any]:
        """Return a JSON-serializable snapshot of current state."""
        # Attach classifications to ingested reviews for the snapshot
        reviews_with_classification = []
        for r in self.ingested_reviews:
            cls = self.review_classifications.get(r["id"], {})
            reviews_with_classification.append({
                **r,
                "classification": cls.get("label", "unclassified"),
                "classification_reason": cls.get("reason", ""),
            })

        return {
            "agent_status": self.agent_status,
            "reviews_ingested": len(self.ingested_reviews),
            "ingested_reviews": reviews_with_classification,
            "reviews_total_available": len(self.ds01_reviews.get("reviews", [])),
            "review_classifications": self.review_classifications,
            "reasoning_log_count": len(self.reasoning_log),
            "reasoning_log": self.reasoning_log,
            "contradictions": self.contradictions,
            "proposed_actions": self.proposed_actions,
            "executed_actions": self.executed_actions,
            "outcome_report": self.outcome_report,
            "crisis_detected": self.crisis_detected,
            "investigation_started": self.investigation_started,
            "auto_stream_active": self.auto_stream_active,
            "data_sources": [
                {"id": "DS-01", "name": "Customer Reviews", "type": "real-time feed", "last_updated": self.ds01_reviews.get("last_updated", ""), "credibility": "direct_customer_feedback"},
                {"id": "DS-02", "name": "Sales & Returns", "type": "CSV 30-day", "last_updated": "2024-11-28T23:59:00Z", "credibility": "internal_transaction_data"},
                {"id": "DS-03", "name": "Supplier Report", "type": "PDF-parsed JSON", "last_updated": self.ds03_supplier.get("last_updated", ""), "credibility": "supplier_self_reported"},
                {"id": "DS-04", "name": "Warehouse Inventory", "type": "manual table", "last_updated": self.ds04_warehouse.get("last_updated", ""), "credibility": "internal_manual_entry"},
                {"id": "DS-05", "name": "Market News", "type": "news article", "last_updated": self.ds05_news.get("last_updated", ""), "credibility": "industry_blog_medium"},
            ],
        }


# Singleton application state
app_state = AppState()
app_state.reset()  # Load initial data
