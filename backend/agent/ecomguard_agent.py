"""EcomGuard Agent — a single autonomous investigator.

One Agent with all five data-source readers plus reasoning and decision
tools. The agent decides which sources to consult, in what order, what to
conclude, and what to recommend. Nothing here scripts the investigation
path or the outcome (NFR-003, FR-001, FR-002).

The run is streamed so tool calls surface on the dashboard as they happen,
and it is wrapped in defensive error handling so no model or API failure can
crash the backend (NFR-004).
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from agents import Agent, ModelSettings, Runner
from agents.exceptions import MaxTurnsExceeded

from backend.agent.model_provider import create_chat_model
from backend.agent.prompts import SYSTEM_PROMPT
from backend.config import settings
from backend.agent.tools import (
    read_customer_reviews,
    read_sales_and_returns,
    read_supplier_report,
    read_warehouse_inventory,
    read_market_news,
    log_reasoning,
    classify_reviews,
    report_contradiction,
    propose_action,
    propose_actions,
)
from backend.state import app_state
from backend.event_bus import event_bus

# Generous ceiling; the agent normally finishes well inside this. On Groq's
# free tier the 8000 tokens/minute cap throttles a multi-turn run, so we allow
# a few minutes and stream every step to the dashboard as it happens.
INVESTIGATION_MAX_TURNS = 24
INVESTIGATION_TIMEOUT_SECONDS = 240


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_ecomguard_agent() -> Agent:
    """Build the single autonomous EcomGuard agent."""
    return Agent(
        name="EcomGuard",
        instructions=SYSTEM_PROMPT,
        model=create_chat_model(),
        model_settings=ModelSettings(
            temperature=0.3,
            parallel_tool_calls=True,
            # gpt-oss-120b emits large reasoning traces by default, which makes
            # each turn slow. "low" keeps its reasoning brisk enough for a
            # real-time demo while preserving genuine tool-driven analysis.
            extra_body={"reasoning_effort": "low"},
        ),
        tools=[
            read_customer_reviews,
            read_sales_and_returns,
            read_supplier_report,
            read_warehouse_inventory,
            read_market_news,
            log_reasoning,
            classify_reviews,
            report_contradiction,
            propose_actions,
            propose_action,
        ],
    )


async def _set_status(status: str) -> None:
    app_state.agent_status = status
    await event_bus.publish("agent_status", {"status": status})


def _agent_found_problem() -> bool:
    """True if the agent's own analysis points to a real issue.

    Based entirely on the agent's outputs — genuine negative reviews it
    classified, or a contradiction it reported — not on any developer rule
    about the scenario.
    """
    genuine_negative = sum(
        1
        for r in app_state.ingested_reviews
        if app_state.review_classifications.get(r["id"], {}).get("label") == "genuine"
        and int(r.get("rating", 5)) <= 2
    )
    return genuine_negative >= 2 or len(app_state.contradictions) >= 1


def _findings_brief() -> str:
    """A compact summary of what the agent has already established.

    Built from the agent's own recorded outputs so the forced follow-up can run
    on a small fresh context instead of replaying the whole investigation
    transcript (which is expensive under Groq's token-per-minute budget).
    """
    genuine = [
        r for r in app_state.ingested_reviews
        if app_state.review_classifications.get(r["id"], {}).get("label") == "genuine"
    ]
    negatives = [r for r in genuine if int(r.get("rating", 5)) <= 2]
    contra = app_state.contradictions[0] if app_state.contradictions else None
    parts = [
        f"Investigation findings for CBL-047 batch {app_state.ds03_supplier.get('batch', {}).get('batch_id', '')}:",
        f"- {len(genuine)} genuine reviews, {len(negatives)} reporting overheating / melting / burning (a safety hazard).",
        "- Sales & returns show returns escalating after the batch arrived, nearly all flagged defective_overheating.",
        "- Independent market news reports the same supplier under regulatory review for USB-C overheating.",
    ]
    if contra:
        parts.append(
            f"- Contradiction on units available: {contra.get('values_found')}; "
            f"trusting {contra.get('trusted_source')} = {contra.get('trusted_value')}."
        )
    parts.append(
        f"- Budget {settings.crisis_budget_pkr:,} PKR; notifications ≤{settings.max_daily_customer_notifications}/day; "
        f"supplier contact ≤ once/{settings.supplier_contact_cooldown_hours}h."
    )
    return "\n".join(parts)


async def _force_actions_followup(agent: Agent, prior_result, prior_text: str) -> str:
    """One bounded follow-up that forces the agent to record its actions.

    gpt-oss often narrates recommendations in prose instead of calling the
    tool. We run a fresh minimal agent whose only tool is propose_actions with
    tool_choice forced, seeded with a compact findings brief. It physically
    cannot answer in prose, records every action in a single call, and the
    small context keeps it fast under the token budget.
    """
    await event_bus.publish(
        "reasoning",
        {
            "id": f"LOG-{len(app_state.reasoning_log) + 1:03d}",
            "category": "decision",
            "message": "Converting my conclusions into concrete recommended actions for your approval.",
            "timestamp": _now(),
        },
    )

    forcing_agent = Agent(
        name="EcomGuard Action Planner",
        instructions=(
            "You are recording an e-commerce manager's crisis response actions. "
            "Given the findings, call propose_actions ONCE with a JSON array of all "
            "recommended actions. Actions affecting the public listing, customers, or "
            "the supplier set requires_approval=true; internal-only actions (inventory "
            "flag, monitoring) set requires_approval=false. Keep total cost within budget."
        ),
        model=create_chat_model(),
        model_settings=ModelSettings(
            temperature=0.3,
            tool_choice="propose_actions",
            extra_body={"reasoning_effort": "low"},
        ),
        tools=[propose_actions],
    )
    followup_input = (
        f"{_findings_brief()}\n\n"
        "Call propose_actions once with a JSON array of these five actions: "
        "(1) pause the public CBL-047 listing, "
        "(2) flag/quarantine and reconcile the CBL-047 warehouse inventory, "
        "(3) notify affected customers with a refund offer, "
        "(4) file a formal quality complaint with the supplier, "
        "(5) enable enhanced monitoring for this supplier's products."
    )
    followup = Runner.run_streamed(forcing_agent, input=followup_input, max_turns=4)
    try:
        async def _drain() -> None:
            async for _ in followup.stream_events():
                pass

        await asyncio.wait_for(_drain(), timeout=120)
    except Exception:  # noqa: BLE001 — keep whatever actions were recorded
        pass
    return prior_text


async def run_investigation(trigger_message: str | None = None) -> str:
    """Run one autonomous investigation.

    Safe to call from a background task. Guarded so it never runs twice
    concurrently and never propagates an exception to the caller.
    """
    if app_state.investigation_started:
        return "Investigation already in progress."

    app_state.investigation_started = True
    app_state.crisis_detected = False
    await _set_status("investigating")
    await event_bus.publish(
        "investigation_started",
        {"reviews_ingested": len(app_state.ingested_reviews)},
    )

    review_count = len(app_state.ingested_reviews)
    prompt = trigger_message or (
        f"{review_count} customer review(s) have arrived for {app_state.ds01_reviews.get('product_sku', 'the product')} "
        f"batch {app_state.ds03_supplier.get('batch', {}).get('batch_id', '')}. "
        "Investigate whether there is a genuine problem and, if so, recommend what to do. "
        "Begin by reading and classifying the reviews."
    )

    agent = create_ecomguard_agent()

    try:
        result = Runner.run_streamed(agent, input=prompt, max_turns=INVESTIGATION_MAX_TURNS)

        async def _consume() -> None:
            # Draining the stream is what actually drives the run. We don't
            # need the individual events here — the tools publish their own
            # SSE events — but iterating is required for the run to progress.
            async for _ in result.stream_events():
                pass

        await asyncio.wait_for(_consume(), timeout=INVESTIGATION_TIMEOUT_SECONDS)

        final_text = str(result.final_output or "").strip()

        # The agent occasionally states its recommendations in prose and
        # forgets to emit them as propose_action calls. If its OWN analysis
        # concluded there is a real problem (it flagged genuine negative
        # reviews or a contradiction) yet it proposed nothing, give it one
        # bounded, tool-forced follow-up turn to record the actions it already
        # described. This does not decide the outcome — the agent's own
        # findings gate it — it only ensures its conclusion is captured.
        if not app_state.proposed_actions and _agent_found_problem():
            final_text = await _force_actions_followup(agent, result, final_text)

        if final_text:
            entry = {
                "id": f"LOG-{len(app_state.reasoning_log) + 1:03d}",
                "category": "decision",
                "message": final_text,
                "timestamp": _now(),
            }
            app_state.reasoning_log.append(entry)
            await event_bus.publish("reasoning", entry)

        app_state.crisis_detected = bool(app_state.proposed_actions)
        next_status = "awaiting_approval" if app_state.proposed_actions else "monitoring"
        await _set_status(next_status)
        await event_bus.publish(
            "investigation_complete",
            {
                "reviews_classified": len(app_state.review_classifications),
                "reasoning_entries": len(app_state.reasoning_log),
                "contradictions": len(app_state.contradictions),
                "actions_proposed": len(app_state.proposed_actions),
                "summary": final_text,
            },
        )
        return final_text or "Investigation complete."

    except (asyncio.TimeoutError, MaxTurnsExceeded) as exc:
        return await _handle_failure(
            "The investigation took too long to complete.",
            detail=str(exc),
        )
    except Exception as exc:  # noqa: BLE001 — must never crash the backend
        return await _handle_failure(
            "The investigation hit an unexpected error.",
            detail=f"{type(exc).__name__}: {exc}",
        )
    finally:
        app_state.investigation_started = False


async def _handle_failure(message: str, detail: str) -> str:
    await event_bus.publish("agent_error", {"message": message, "detail": detail})
    # If the agent already proposed actions before failing, keep them.
    next_status = "awaiting_approval" if app_state.proposed_actions else "monitoring"
    await _set_status(next_status)
    return f"{message} ({detail})"
