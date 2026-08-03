"""Action Execution Engine.

Handles sequential execution of approved actions with state transitions,
retry logic, and deliberate failure for demo purposes.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any

from backend.state import app_state
from backend.event_bus import event_bus


# ---------------------------------------------------------------------------
# Simulated action executors
# ---------------------------------------------------------------------------

async def _execute_pause_listing(action: dict) -> dict:
    """Simulate pausing the product listing."""
    await asyncio.sleep(1.5)
    return {
        "success": True,
        "message": "Product listing for CBL-047 (USB-C Fast Charging Cable) has been paused on all sales channels.",
        "details": "Listing status changed from 'Active' to 'Paused - Safety Review'. Customers searching for this product will see 'Currently Unavailable'.",
        "state_change": {"listing_status": "paused"},
    }


async def _execute_flag_inventory(action: dict) -> dict:
    """Simulate flagging inventory for quarantine."""
    await asyncio.sleep(1.0)
    warehouse = app_state.ds04_warehouse
    for item in warehouse.get("inventory", []):
        if item["sku"] == "CBL-047":
            item["status"] = "quarantined"
    return {
        "success": True,
        "message": "All CBL-047 inventory (Batch B2024-11) has been flagged for quarantine in the warehouse system.",
        "details": "Warehouse staff notified. Physical quarantine labels to be applied within 2 hours. Units will not be picked for orders.",
        "state_change": {"inventory_status": "quarantined"},
    }


async def _execute_notify_customers(action: dict) -> dict:
    """Simulate sending customer notifications."""
    await asyncio.sleep(2.0)
    return {
        "success": True,
        "message": "Safety notification drafted for all customers who purchased CBL-047 from Batch B2024-11.",
        "details": "Notification covers 156 affected customers. Batch 1 (78 customers) sent immediately. Batch 2 (78 customers) scheduled for tomorrow. Each notification includes: safety warning, return instructions, and full refund offer.",
        "state_change": {"customers_notified": 156, "notification_batches": 2},
    }


_supplier_attempt_count = 0


async def _execute_contact_supplier(action: dict) -> dict:
    """Simulate contacting the supplier — DELIBERATELY FAILS both attempts.

    This drives the full failure path for the demo (SC-007, FR-029/030/031):
    the engine retries once, both attempts fail, so it escalates and produces a
    manual draft the manager can send themselves, while the remaining actions
    in the chain continue unaffected.
    """
    global _supplier_attempt_count
    _supplier_attempt_count += 1

    await asyncio.sleep(1.2)

    return {
        "success": False,
        "message": "Failed to reach ShenZhen CableWorks Ltd via the automated supplier portal.",
        "details": "Supplier API returned HTTP 503 — Service Unavailable. The supplier's communication portal appears to be under maintenance.",
        "error_code": "SUPPLIER_API_503",
    }


async def _execute_generate_report(action: dict) -> dict:
    """Simulate generating an incident report."""
    await asyncio.sleep(1.0)
    report_text = (
        "INCIDENT REPORT — CBL-047 USB-C Cable Overheating Crisis\n"
        "========================================================\n\n"
        f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n"
        f"Product: CBL-047 USB-C Fast Charging Cable (1.5m, Braided)\n"
        f"Batch: B2024-11 (Manufactured: 2024-10-28, Arrived: 2024-11-18)\n"
        f"Supplier: ShenZhen CableWorks Ltd\n\n"
        "SUMMARY: Multiple customers reported USB-C connector overheating and partial\n"
        "melting during normal charging operations. Investigation confirmed a batch-wide\n"
        "defect linked to a cost-cutting connector redesign by the supplier. The supplier\n"
        "is under regulatory review in multiple Asian markets for the same issue.\n\n"
        "ACTIONS TAKEN:\n"
        "1. Product listing paused across all sales channels\n"
        "2. Remaining inventory quarantined\n"
        "3. Affected customers notified with safety warning and refund offer\n"
        "4. Formal quality complaint filed with supplier\n\n"
        "RECOMMENDED FOLLOW-UP:\n"
        "- Conduct physical inventory count to reconcile stock discrepancy\n"
        "- Await supplier root cause analysis (72-hour deadline)\n"
        "- Consider alternative supplier for future USB-C cable orders\n"
        "- Monitor for any additional customer reports of device damage\n"
    )
    return {
        "success": True,
        "message": "Incident report generated and ready for stakeholder distribution.",
        "details": report_text,
        "state_change": {"report_generated": True},
    }


async def _execute_update_monitoring(action: dict) -> dict:
    """Simulate updating monitoring rules."""
    await asyncio.sleep(0.5)
    return {
        "success": True,
        "message": "Enhanced monitoring activated for all ShenZhen CableWorks products.",
        "details": "New monitoring rules: (1) Alert on any new CBL-047 review regardless of rating, (2) Daily return rate check for all ShenZhen CableWorks SKUs, (3) Weekly supplier news scan.",
        "state_change": {"monitoring_enhanced": True},
    }


_EXECUTORS = {
    "pause_listing": _execute_pause_listing,
    "flag_inventory": _execute_flag_inventory,
    "notify_customers": _execute_notify_customers,
    "contact_supplier": _execute_contact_supplier,
    "generate_report": _execute_generate_report,
    "update_monitoring": _execute_update_monitoring,
}


# ---------------------------------------------------------------------------
# Main execution engine
# ---------------------------------------------------------------------------

async def execute_approved_actions() -> list[dict]:
    """Execute all approved actions sequentially with retry and failure handling."""
    global _supplier_attempt_count
    _supplier_attempt_count = 0  # Reset for this execution run

    app_state.agent_status = "executing"
    await event_bus.publish("agent_status", {"status": "executing"})

    results = []

    approved = [a for a in app_state.proposed_actions if a.get("status") == "approved"]

    for action in approved:
        action_id = action["id"]
        category = action.get("category", "unknown")
        executor = _EXECUTORS.get(category)

        if not executor:
            result = {
                "action_id": action_id,
                "status": "failed",
                "message": f"No executor found for category: {category}",
            }
            results.append(result)
            app_state.executed_actions.append(result)
            await event_bus.publish("action_failed", result)
            continue

        # Update status to executing
        action["status"] = "executing"
        await event_bus.publish("action_executing", {
            "action_id": action_id,
            "title": action.get("title", ""),
            "category": category,
        })

        # First attempt
        try:
            outcome = await executor(action)
        except Exception as e:
            outcome = {"success": False, "message": f"Execution error: {str(e)}"}

        if outcome["success"]:
            action["status"] = "complete"
            result = {
                "action_id": action_id,
                "status": "complete",
                "attempt": 1,
                **outcome,
            }
            results.append(result)
            app_state.executed_actions.append(result)
            await event_bus.publish("action_complete", result)
        else:
            # First failure — retry once (FR-029)
            await event_bus.publish("action_failed", {
                "action_id": action_id,
                "attempt": 1,
                "message": outcome["message"],
                "retrying": True,
            })

            await asyncio.sleep(1.0)

            # Retry
            try:
                retry_outcome = await executor(action)
            except Exception as e:
                retry_outcome = {"success": False, "message": f"Retry error: {str(e)}"}

            if retry_outcome["success"]:
                action["status"] = "complete"
                result = {
                    "action_id": action_id,
                    "status": "complete",
                    "attempt": 2,
                    "note": "Succeeded on retry after initial failure.",
                    **retry_outcome,
                }
                results.append(result)
                app_state.executed_actions.append(result)
                await event_bus.publish("action_complete", result)
            else:
                # Escalation — produce alternative output (FR-031)
                action["status"] = "escalated"
                fallback = _generate_fallback(action, retry_outcome)
                result = {
                    "action_id": action_id,
                    "status": "escalated",
                    "attempt": 2,
                    "original_error": retry_outcome["message"],
                    "fallback": fallback,
                }
                results.append(result)
                app_state.executed_actions.append(result)
                await event_bus.publish("action_escalated", result)

    # Generate outcome report after all actions complete
    await _generate_outcome_report()

    app_state.agent_status = "resolved"
    await event_bus.publish("agent_status", {"status": "resolved"})

    return results


def _generate_fallback(action: dict, error: dict) -> dict:
    """Generate a manual fallback when an action fails permanently."""
    category = action.get("category", "")

    if category == "contact_supplier":
        return {
            "type": "manual_draft",
            "title": "Manual Supplier Communication Draft",
            "content": (
                f"TO: ShenZhen CableWorks Ltd — Quality Assurance Department\n"
                f"FROM: TechMart PK — Operations\n"
                f"SUBJECT: URGENT — Quality Defect Report for Batch B2024-11 (CBL-047)\n\n"
                f"Dear Quality Assurance Team,\n\n"
                f"We are writing to formally report a critical quality defect in Batch B2024-11 "
                f"of the USB-C Fast Charging Cable (SKU: CBL-047).\n\n"
                f"Multiple customers have reported connector overheating and partial melting "
                f"during normal charging operations. We have received {len(app_state.ingested_reviews)} "
                f"customer reviews, with the majority reporting temperatures exceeding 60°C "
                f"at the connector housing.\n\n"
                f"We require:\n"
                f"1. Immediate acknowledgment of this report\n"
                f"2. Root cause analysis within 72 hours\n"
                f"3. Corrective action plan for remaining inventory\n"
                f"4. Compensation discussion for affected customers\n\n"
                f"Please treat this as a PRIORITY case.\n\n"
                f"Regards,\nTechMart PK Operations Team"
            ),
            "instruction": "The automated supplier contact system is unavailable. Please send this email manually to the supplier's quality assurance department.",
        }

    return {
        "type": "manual_action",
        "title": f"Manual Action Required: {action.get('title', 'Unknown')}",
        "content": f"The automated execution of '{action.get('title')}' failed. Please complete this action manually.",
        "instruction": "Contact the relevant team to complete this action.",
    }


async def _generate_outcome_report() -> None:
    """Generate the before/after outcome report."""
    genuine_reviews = [
        r for r in app_state.ingested_reviews
        if app_state.review_classifications.get(r["id"], {}).get("label") == "genuine"
    ]
    bad_reviews = [r for r in genuine_reviews if r.get("rating", 5) <= 2]
    noise_reviews = [
        r for r in app_state.ingested_reviews
        if app_state.review_classifications.get(r["id"], {}).get("label") in {"spam", "duplicate", "wrong_batch"}
    ]

    total_actions = len(app_state.executed_actions)
    successful = sum(1 for a in app_state.executed_actions if a.get("status") == "complete")
    escalated = sum(1 for a in app_state.executed_actions if a.get("status") == "escalated")
    executed_categories = {
        a.get("category")
        for a in app_state.proposed_actions
        if a.get("status") in {"complete", "escalated", "executing", "approved"}
    }

    # Derive real figures from the data rather than hardcoding them.
    sales_rows = [r for r in app_state.ds02_sales if r.get("sku") == "CBL-047"]
    units_sold = sum(int(r.get("units_sold", 0)) for r in sales_rows)
    units_returned = sum(int(r.get("units_returned", 0)) for r in sales_rows)
    warehouse_item = next(
        (i for i in app_state.ds04_warehouse.get("inventory", []) if i.get("sku") == "CBL-047"),
        {},
    )
    warehouse_stock = warehouse_item.get("quantity_in_stock", 0)
    units_in_field = max(units_sold - units_returned, 0)
    listing_paused = "pause_listing" in executed_categories
    inventory_flagged = "flag_inventory" in executed_categories
    customers_notified = "notify_customers" in executed_categories
    supplier_contacted = "contact_supplier" in executed_categories
    total_cost = sum(int(a.get("estimated_cost_pkr", 0)) for a in app_state.proposed_actions)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "crisis_summary": "USB-C Cable Overheating — Batch B2024-11",
        "metrics": {
            "product_listing_status": {
                "before": "Active — selling normally",
                "after": "Paused — safety review" if listing_paused else "Still active — pause not approved",
                "improvement": "Stopped new sales of the defective batch" if listing_paused else "No change — listing pause was not approved",
            },
            "units_at_risk": {
                "before": f"~{units_in_field} units already with customers, {warehouse_stock} in the warehouse",
                "after": (f"{warehouse_stock} warehouse units quarantined; sales halted" if inventory_flagged
                          else f"{warehouse_stock} warehouse units still sellable"),
                "improvement": "No additional defective units can reach customers" if (inventory_flagged and listing_paused) else "Partial containment",
            },
            "supplier_relationship": {
                "before": "Active — no quality flags on record",
                "after": ("Under formal review — quality complaint escalated for manual filing"
                          if supplier_contacted else "Unchanged"),
                "improvement": "Supplier accountability initiated with a root-cause request" if supplier_contacted else "No supplier action taken",
            },
            "customer_exposure": {
                "before": f"{units_in_field} customers with potentially defective cables, unaware of the risk",
                "after": (f"Affected customers being notified with a refund offer"
                          if customers_notified else "Customers not yet notified"),
                "improvement": "Proactive safety notification and refund path opened" if customers_notified else "No change",
            },
            "brand_risk_level": {
                "before": "Critical — unaddressed safety defect with active sales",
                "after": "Managed — proactive, documented response" if listing_paused else "Elevated",
                "improvement": "Shifted from reactive crisis to proactive brand protection",
            },
            "financial_impact": {
                "before": "Uncapped liability — continued sales of a defective product",
                "after": f"Estimated response cost: {total_cost:,} PKR",
                "improvement": (f"Contained within the 50,000 PKR crisis budget"
                                if total_cost <= 50000 else "Exceeds the 50,000 PKR budget — review needed"),
            },
        },
        "baseline_comparison": {
            "ecomguard_detection": (
                f"Detected from {len(genuine_reviews)} genuine reviews ({len(bad_reviews)} reporting overheating) "
                f"corroborated across sales, supplier and market-news data — while the product still showed positive revenue."
            ),
            "simple_threshold_detection": (
                "A simple average-rating alert (fires below 3.0 stars) would not trigger until enough bad reviews "
                "dragged the running average down — several days later, after more defective units shipped."
            ),
            "time_advantage": "EcomGuard flagged the crisis days earlier by reading the escalating trend, not just the average.",
            "quality_advantage": (
                f"It also excluded {len(noise_reviews)} noise reviews (spam / duplicate / wrong-batch) that a naive "
                "rule would have counted, and cross-checked three sources — a threshold rule sees only the number."
            ),
        },
        "rollback_condition": {
            "trigger": "If the supplier provides certified evidence the defect was isolated to a sub-batch, the quarantine can be partially lifted.",
            "observable_event": "Independent lab confirms connector temperature < 45°C under 65W charging AND re-tested defect rate < 1%.",
            "restore_action": "Re-activate the listing for verified units only and keep enhanced monitoring for 30 days.",
        },
        "outstanding_items": [
            "Physical inventory count to resolve the stock discrepancy the agent flagged",
            "Await supplier root-cause analysis (72-hour deadline from complaint filing)",
            "Process customer refund requests as they arrive",
            "Evaluate alternative USB-C cable suppliers",
        ] + (["Manually send the escalated supplier complaint (automated portal was down)"] if escalated else []),
        "incident_report": _build_incident_report(
            genuine=len(genuine_reviews), bad=len(bad_reviews), noise=len(noise_reviews),
            units_returned=units_returned, listing_paused=listing_paused,
            inventory_flagged=inventory_flagged, customers_notified=customers_notified,
            supplier_contacted=supplier_contacted, escalated=escalated,
        ),
        "actions_summary": {
            "total": total_actions,
            "successful": successful,
            "escalated": escalated,
            "failed": total_actions - successful - escalated,
        },
    }

    app_state.outcome_report = report
    await event_bus.publish("outcome_report", report)


def _build_incident_report(**k) -> str:
    """FR-035 — a plain-English incident report the manager can share."""
    lines = [
        "INCIDENT REPORT — CBL-047 USB-C Cable, Batch B2024-11",
        "",
        "SUMMARY",
        f"Customers reported the CBL-047 USB-C cable overheating, with some cases of connector melting and "
        f"a burning smell. Of the reviews received, {k['genuine']} were assessed as genuine and {k['bad']} of "
        f"those described overheating. {k['noise']} reviews were excluded as spam, duplicates, or wrong-batch. "
        f"Sales data showed {k['units_returned']} returns concentrated after the batch arrived, and independent "
        f"market news linked the supplier to the same defect under regulatory review — pointing to a batch-wide "
        f"quality defect rather than isolated complaints.",
        "",
        "ACTIONS TAKEN",
    ]
    taken = []
    if k["listing_paused"]:
        taken.append("Paused the public CBL-047 listing to stop new sales.")
    if k["inventory_flagged"]:
        taken.append("Flagged and quarantined remaining CBL-047 warehouse stock.")
    if k["customers_notified"]:
        taken.append("Notified affected customers with a safety warning and refund offer.")
    if k["supplier_contacted"]:
        if k["escalated"]:
            taken.append("Attempted to file a formal quality complaint with the supplier; the automated portal "
                         "was unavailable, so a manual complaint draft was prepared for sending.")
        else:
            taken.append("Filed a formal quality complaint with the supplier.")
    if not taken:
        taken.append("No response actions were approved.")
    lines += [f"{i+1}. {t}" for i, t in enumerate(taken)]
    lines += [
        "",
        "RECOMMENDED FOLLOW-UP",
        "Conduct a physical inventory count, await the supplier's root-cause analysis, process refunds as they "
        "arrive, and evaluate alternative suppliers for future USB-C cable orders.",
    ]
    return "\n".join(lines)
