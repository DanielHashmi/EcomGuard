"""Agent function tools.

The agent has three kinds of tools:

1. Data-source readers (DS-01..DS-05) — the agent decides which to read
   and in what order. Each returns human-readable text plus the source's
   metadata (type, last-updated, credibility) so the agent can reason
   about which source to trust.
2. Reasoning tools — log_reasoning, classify_reviews, report_contradiction.
3. Decision tools — propose_action.

Every tool pushes an event to the SSE bus so the manager dashboard
updates in real time as the agent works. Nothing here decides the
outcome — the agent's tool calls and their arguments come entirely from
its own reasoning over the data.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from agents import function_tool

from backend.state import app_state
from backend.event_bus import event_bus


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Data source readers (DS-01 .. DS-05)
# ---------------------------------------------------------------------------

async def _announce_read(tool: str, label: str, source_id: str, purpose: str = "") -> None:
    # Emit the live tool event AND persist a reasoning entry, so the "agent is
    # consulting source X" step survives a state-snapshot reload on the client
    # (US-03: the manager sees the agent autonomously choosing sources).
    await event_bus.publish(
        "tool_used",
        {"tool": tool, "label": label, "source_id": source_id, "purpose": purpose, "at": _now()},
    )
    entry = {
        "id": f"LOG-{len(app_state.reasoning_log) + 1:03d}",
        "category": "observation",
        "message": f"Consulting {label}" + (f" — {purpose}" if purpose else ""),
        "timestamp": _now(),
    }
    app_state.reasoning_log.append(entry)
    await event_bus.publish("reasoning", entry)


@function_tool
async def read_customer_reviews(purpose: str = "") -> str:
    """Read ingested customer reviews (DS-01): id, rating, review date, purchase date, batch, text."""
    await _announce_read("read_customer_reviews", "Customer Reviews (DS-01)", "DS-01", purpose)

    reviews = app_state.ingested_reviews
    if not reviews:
        return "No customer reviews have been ingested yet."

    header = (
        "DS-01 Customer Reviews Feed | type: real-time customer feedback | "
        f"credibility: direct first-party customer reports | reviews ingested: {len(reviews)}\n"
        "Each line: id | rating | review_date | purchase_date | batch_received | text\n"
    )
    lines = [
        " | ".join([
            r["id"],
            f"{r['rating']}★",
            r["date"][:10],
            r.get("purchase_date", "unknown")[:10],
            r.get("batch", "unknown"),
            r["text"],
        ])
        for r in reviews
    ]
    return header + "\n".join(lines)


@function_tool
async def read_sales_and_returns(purpose: str = "") -> str:
    """Read 30-day CBL-047 sales & returns (DS-02): daily units sold, returned, reason, revenue. First-party; returns lag sales."""
    await _announce_read("read_sales_and_returns", "Sales & Returns (DS-02)", "DS-02", purpose)

    rows = [r for r in app_state.ds02_sales if r.get("sku") == "CBL-047"]
    if not rows:
        return "No sales data available for CBL-047."

    sold = sum(int(r.get("units_sold", 0)) for r in rows)
    returned = sum(int(r.get("units_returned", 0)) for r in rows)
    revenue = sum(int(r.get("revenue_pkr", 0)) for r in rows)
    rate = round(returned / sold * 100, 2) if sold else 0.0

    # Compact but temporally informative: show only the days that carry the
    # signal (any return, or the last 10 days) so the agent can see the trend
    # without re-sending 30 near-identical rows on every turn.
    def _r(row: dict) -> str:
        return " | ".join([
            row.get("date", "")[:10],
            f"sold {row.get('units_sold', 0)}",
            f"returned {row.get('units_returned', 0)}",
            (row.get("return_reason") or "-"),
        ])

    signal_rows = [r for r in rows if int(r.get("units_returned", 0)) > 0]
    recent = rows[-10:]
    shown = {r.get("date"): r for r in (signal_rows + recent)}
    shown_rows = [shown[d] for d in sorted(shown)]

    header = (
        "DS-02 Sales & Returns | type: internal transaction CSV (30 days) | "
        "credibility: first-party transaction data, updated daily through 2024-11-28\n"
        f"CBL-047 30-day totals: {sold} units sold, {returned} returned "
        f"({rate}% overall return rate), revenue {revenue:,} PKR.\n"
        "Days with returns or in the last 10 days (date | sold | returned | reason); "
        "earlier omitted days had 0 returns:\n"
    )
    return header + "\n".join(_r(r) for r in shown_rows)


@function_tool
async def read_supplier_report(purpose: str = "") -> str:
    """Read the supplier quality report (DS-03): batch, units shipped, QA failure rate, certs, external flags. Self-reported."""
    await _announce_read("read_supplier_report", "Supplier Report (DS-03)", "DS-03", purpose)

    d = app_state.ds03_supplier
    if not d:
        return "No supplier report available."

    supplier = d.get("supplier", {})
    batch = d.get("batch", {})
    certs = d.get("certifications", {})
    flags = d.get("external_flags", [])

    cert_str = ", ".join(f"{k}:{v.get('status')}" for k, v in certs.items())
    flag_str = "; ".join(
        f"{f.get('flag_type')} ({f.get('severity')}) — {f.get('description')}" for f in flags
    ) or "none"

    return (
        f"DS-03 Supplier Quality Report | type: supplier-parsed PDF | "
        f"credibility: SELF-REPORTED BY SUPPLIER (lowest independence) | "
        f"last updated: {d.get('last_updated', 'unknown')[:10]}\n"
        f"Supplier: {supplier.get('name')} ({supplier.get('location')}), "
        f"relationship since {supplier.get('relationship_since')}, "
        f"{supplier.get('total_batches_supplied')} batches supplied, "
        f"{supplier.get('previous_incident_count')} prior incident(s): "
        f"{supplier.get('previous_incident_detail')}\n"
        f"Batch {batch.get('batch_id')}: manufactured {batch.get('manufacture_date')}, "
        f"arrived {batch.get('arrival_date')}, {batch.get('units_in_batch')} units in batch, "
        f"{batch.get('units_shipped')} units shipped to TechMart, "
        f"{batch.get('units_held_for_qa')} held for QA.\n"
        f"Supplier QA: sampled {batch.get('qa_sample_size')} units, {batch.get('qa_failures')} failures "
        f"= {batch.get('qa_failure_rate_percent')}% claimed failure rate. "
        f"Detail: {batch.get('qa_failure_detail')}\n"
        f"Certifications: {cert_str}\n"
        f"External flags: {flag_str}\n"
        f"Supplier's own conclusion: {d.get('notes')}"
    )


@function_tool
async def read_warehouse_inventory(purpose: str = "") -> str:
    """Read warehouse inventory (DS-04): on-hand CBL-047 stock and per-SKU last-count timestamp. Manually entered, may be stale."""
    await _announce_read("read_warehouse_inventory", "Warehouse Inventory (DS-04)", "DS-04", purpose)

    d = app_state.ds04_warehouse
    if not d:
        return "No warehouse inventory data available."

    item = next((i for i in d.get("inventory", []) if i.get("sku") == "CBL-047"), None)
    if not item:
        return "CBL-047 not found in warehouse inventory."

    return (
        f"DS-04 Warehouse Inventory | type: manually maintained table | "
        f"credibility: internal but MANUALLY ENTERED, only as current as the last physical count | "
        f"location: {d.get('warehouse_location')}\n"
        f"Note: {d.get('note')}\n"
        f"CBL-047: {item.get('quantity_in_stock')} units in stock, batch {item.get('batch')}, "
        f"status {item.get('status')}, location {item.get('location')}, "
        f"reorder point {item.get('reorder_point')}.\n"
        f"This CBL-047 figure was last physically counted: {item.get('last_updated')}."
    )


@function_tool
async def read_market_news(purpose: str = "") -> str:
    """Read the market intelligence feed (DS-05): independent industry news that may mention the supplier or product."""
    await _announce_read("read_market_news", "Market News (DS-05)", "DS-05", purpose)

    d = app_state.ds05_news
    if not d:
        return "No market news available."

    articles = d.get("articles", [])
    header = (
        "DS-05 Market Intelligence Feed | type: external news articles | "
        f"credibility: third-party, independent of TechMart | articles: {len(articles)}\n"
    )
    # Trim each body to its first two sentences plus a compact fact line;
    # the full article text re-sent every turn is the single biggest token
    # cost, and the lede + facts carry all the signal the agent needs.
    def _summarise(a: dict) -> str:
        body = (a.get("body") or "").strip()
        lede = " ".join(s.strip() for s in body.split("\n\n")[0].split(". ")[:2])
        if lede and not lede.endswith("."):
            lede += "."
        return (
            f"[{a.get('id')}] {a.get('headline')}\n"
            f"Source: {a.get('source')} | published {a.get('published_date', '')[:10]} | "
            f"reliability: {a.get('reliability_score')}\n"
            f"{lede}"
        )

    return header + "\n\n".join(_summarise(a) for a in articles)


# ---------------------------------------------------------------------------
# Reasoning tools
# ---------------------------------------------------------------------------

@function_tool
async def log_reasoning(category: str, message: str) -> str:
    """Log one plain-English reasoning step for the manager, live.

    Args:
        category: observation, question, discovery, decision, or warning.
        message: One short, non-technical sentence.
    """
    valid = {"observation", "question", "discovery", "decision", "warning"}
    category = (category or "").strip().lower()
    if category not in valid:
        category = "observation"

    entry = {
        "id": f"LOG-{len(app_state.reasoning_log) + 1:03d}",
        "category": category,
        "message": message,
        "timestamp": _now(),
    }
    app_state.reasoning_log.append(entry)
    await event_bus.publish("reasoning", entry)
    return "logged"


def _coerce_verdict(item: object) -> dict | None:
    """Pull a {review_id, label, reason} dict out of whatever the model sent.

    Different models wrap list items differently (some nest under a
    "verdict"/"review" key, some vary the field names). Be lenient.
    """
    if not isinstance(item, dict):
        return None
    if len(item) == 1:
        inner = next(iter(item.values()))
        if isinstance(inner, dict):
            item = inner
    review_id = item.get("review_id") or item.get("id") or item.get("reviewId")
    label = item.get("label") or item.get("classification") or item.get("verdict")
    reason = item.get("reason") or item.get("why") or item.get("explanation") or ""
    if not review_id or not label:
        return None
    return {"review_id": str(review_id), "label": str(label), "reason": str(reason)}


@function_tool
async def classify_reviews(reviews_json: str) -> str:
    """Record legitimacy verdicts for reviews. Only 'genuine' reviews count as signal.

    Args:
        reviews_json: JSON array of {"review_id","label","reason"}. label ∈
            genuine|spam|duplicate|wrong_batch. Classify every review in one call.
    """
    raw = (reviews_json or "").strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return "Could not parse reviews_json. Pass a JSON array of {review_id, label, reason} objects."

    if isinstance(parsed, dict):
        # Model may have wrapped the array, e.g. {"verdicts": [...]}.
        for v in parsed.values():
            if isinstance(v, list):
                parsed = v
                break
        else:
            parsed = [parsed]
    if not isinstance(parsed, list):
        return "reviews_json must be a JSON array of {review_id, label, reason} objects."

    valid = {"genuine", "spam", "duplicate", "wrong_batch"}
    applied = 0
    for item in parsed:
        coerced = _coerce_verdict(item)
        if not coerced:
            continue
        label = coerced["label"].strip().lower()
        if label not in valid:
            continue
        app_state.review_classifications[coerced["review_id"]] = {
            "label": label,
            "reason": coerced["reason"],
            "classified_at": _now(),
        }
        await event_bus.publish(
            "review_classified",
            {"review_id": coerced["review_id"], "label": label, "reason": coerced["reason"]},
        )
        applied += 1

    genuine = sum(1 for c in app_state.review_classifications.values() if c["label"] == "genuine")
    excluded = len(app_state.review_classifications) - genuine
    return f"Recorded {applied} verdict(s). {genuine} genuine, {excluded} excluded so far."


@function_tool
async def report_contradiction(
    metric_name: str,
    sources_involved: str,
    values_found: str,
    trusted_source: str,
    trusted_value: str,
    reasoning: str,
    recommendation: str,
) -> str:
    """Surface a metric that 2+ sources report differently. Don't silently pick one.

    Args:
        metric_name: The conflicting metric, e.g. "CBL-047 units available".
        sources_involved: e.g. "DS-02, DS-03, DS-04".
        values_found: The differing values with their source.
        trusted_source: Source you'll rely on.
        trusted_value: Figure you'll use.
        reasoning: Why you trust it (recency, type, independence).
        recommendation: Human verification step you advise.
    """
    contradiction = {
        "id": f"CONTRA-{len(app_state.contradictions) + 1:03d}",
        "metric_name": metric_name,
        "sources_involved": sources_involved,
        "values_found": values_found,
        "trusted_source": trusted_source,
        "trusted_value": trusted_value,
        "reasoning": reasoning,
        "recommendation": recommendation,
        "discovered_at": _now(),
    }
    app_state.contradictions.append(contradiction)
    await event_bus.publish("contradiction_found", contradiction)
    return f"Contradiction on '{metric_name}' recorded; using {trusted_source} = {trusted_value}."


# ---------------------------------------------------------------------------
# Decision tool
# ---------------------------------------------------------------------------

_ACTION_CATEGORIES = {
    "pause_listing",
    "flag_inventory",
    "notify_customers",
    "contact_supplier",
    "generate_report",
    "update_monitoring",
}


async def _add_action(
    *,
    title: str,
    description: str,
    category: str,
    requires_approval: bool,
    risk_level: str,
    estimated_cost_pkr: int,
    urgency: str,
    rationale: str,
    tradeoffs: str,
    constraint_notes: str,
) -> str:
    category = (category or "").strip().lower()
    if category not in _ACTION_CATEGORIES:
        category = "generate_report"
    risk = (risk_level or "medium").strip().lower()
    if risk not in {"low", "medium", "high", "critical"}:
        risk = "medium"

    # Bound the total (also protects the forced-tool follow-up from looping).
    if len(app_state.proposed_actions) >= 6:
        return "limit_reached"

    # Avoid duplicate proposals of the same category+title.
    for existing in app_state.proposed_actions:
        if existing["category"] == category and existing["title"].strip().lower() == (title or "").strip().lower():
            return f"duplicate:{existing['id']}"

    action = {
        "id": f"ACT-{len(app_state.proposed_actions) + 1:03d}",
        "title": title,
        "description": description,
        "category": category,
        "requires_approval": bool(requires_approval),
        "risk_level": risk,
        "estimated_cost_pkr": int(estimated_cost_pkr or 0),
        "urgency": (urgency or "same_day").strip().lower(),
        "rationale": rationale,
        "tradeoffs": tradeoffs,
        "constraint_notes": constraint_notes,
        # Internal low-risk actions are auto-approved (FR-025); external /
        # public-facing actions stay pending until the manager approves.
        "status": "pending" if requires_approval else "approved",
        "auto_approved": not bool(requires_approval),
        "proposed_at": _now(),
    }
    app_state.proposed_actions.append(action)
    await event_bus.publish("action_proposed", action)
    if action["auto_approved"]:
        await event_bus.publish(
            "action_auto_approved",
            {"action_id": action["id"], "title": title,
             "message": f"Internal action auto-approved and queued: {title}"},
        )
    return action["id"]


def _coerce_action(item: object) -> dict | None:
    """Normalise one action object from possibly-varied model output."""
    if not isinstance(item, dict):
        return None
    if len(item) == 1:
        inner = next(iter(item.values()))
        if isinstance(inner, dict):
            item = inner
    title = item.get("title") or item.get("name")
    if not title:
        return None

    def _b(v: object) -> bool:
        if isinstance(v, bool):
            return v
        return str(v).strip().lower() in {"true", "1", "yes"}

    def _i(v: object) -> int:
        try:
            return int(float(v))
        except (TypeError, ValueError):
            return 0

    return {
        "title": str(title),
        "description": str(item.get("description", "")),
        "category": str(item.get("category", "generate_report")),
        "requires_approval": _b(item.get("requires_approval", True)),
        "risk_level": str(item.get("risk_level", "medium")),
        "estimated_cost_pkr": _i(item.get("estimated_cost_pkr", 0)),
        "urgency": str(item.get("urgency", "same_day")),
        "rationale": str(item.get("rationale", "")),
        "tradeoffs": str(item.get("tradeoffs", "")),
        "constraint_notes": str(item.get("constraint_notes", "")),
    }


@function_tool
async def propose_actions(actions_json: str) -> str:
    """Propose ALL recommended actions in one call (fastest — preferred).

    Args:
        actions_json: JSON array of action objects. Each object has:
            title, description, category, requires_approval (bool), risk_level
            (low|medium|high|critical), estimated_cost_pkr (int), urgency
            (immediate|same_day|this_week), rationale, tradeoffs, constraint_notes.
            category ∈ pause_listing|flag_inventory|notify_customers|
            contact_supplier|generate_report|update_monitoring. Set
            requires_approval=true for anything touching customers, the supplier,
            or the public listing; false for internal-only actions.
    """
    raw = (actions_json or "").strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return "Could not parse actions_json. Pass a JSON array of action objects."

    if isinstance(parsed, dict):
        for v in parsed.values():
            if isinstance(v, list):
                parsed = v
                break
        else:
            parsed = [parsed]
    if not isinstance(parsed, list):
        return "actions_json must be a JSON array of action objects."

    added = 0
    for item in parsed:
        coerced = _coerce_action(item)
        if not coerced:
            continue
        result = await _add_action(**coerced)
        if result.startswith("ACT-"):
            added += 1
    return f"Recorded {added} action(s) for the manager. Total proposed: {len(app_state.proposed_actions)}."


@function_tool
async def propose_action(
    title: str,
    description: str,
    category: str,
    requires_approval: bool,
    risk_level: str,
    estimated_cost_pkr: int,
    urgency: str,
    rationale: str,
    tradeoffs: str,
    constraint_notes: str,
) -> str:
    """Propose one recommended action. Prefer propose_actions to record all at once.

    Args:
        title: Short title, e.g. "Pause CBL-047 listing".
        description: What it does, plain English.
        category: pause_listing|flag_inventory|notify_customers|contact_supplier|generate_report|update_monitoring.
        requires_approval: true if it affects customers, supplier, or public listing.
        risk_level: low|medium|high|critical.
        estimated_cost_pkr: Cost/impact in PKR (0 if none).
        urgency: immediate|same_day|this_week.
        rationale: Why, tied to evidence.
        tradeoffs: Downside of doing it, and of not doing it.
        constraint_notes: How budget/constraints shaped it.
    """
    result = await _add_action(
        title=title,
        description=description,
        category=category,
        requires_approval=requires_approval,
        risk_level=risk_level,
        estimated_cost_pkr=estimated_cost_pkr,
        urgency=urgency,
        rationale=rationale,
        tradeoffs=tradeoffs,
        constraint_notes=constraint_notes,
    )
    if result == "limit_reached":
        return "Action limit reached (6). Stop proposing."
    if result.startswith("duplicate:"):
        return f"Already proposed a similar action ({result.split(':')[1]}); not duplicating."
    return f"Proposed action {result}: {title} (approval required: {bool(requires_approval)})."
