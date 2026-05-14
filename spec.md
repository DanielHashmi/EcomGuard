# EcomGuard
## Autonomous Product Crisis Intelligence Agent — Manager Dashboard
**Spec v3.0**

---

## Overview

E-commerce managers cannot simultaneously monitor every signal across their operations. Customer complaints, sales trends, supplier data, warehouse records, and market news exist in silos. By the time a product crisis becomes visible through a single channel, significant damage is already done.

EcomGuard is an autonomous AI agent that continuously watches five operational data sources for a Pakistani e-commerce business. When signals from multiple sources begin converging toward a problem, the agent investigates independently, reasons about what it finds, identifies contradictions, and surfaces a complete picture — along with proposed actions — to the manager's mobile dashboard in real time.

The manager sees what the agent found, why it matters, and what it recommends. The manager approves high-impact actions. The agent executes and reports.

---

## Problem Statement

**For the manager:** No visibility into emerging product crises until they become customer-facing failures. No system connects signals across sources. Response is reactive, not proactive.

**For the business:** Revenue signals hide safety problems. A product with high sales can simultaneously have a dangerous quality defect — because returns lag purchases by 3–5 days. Without cross-source analysis, the positive revenue signal wins and the problem grows.

**For the hackathon:** Most AI systems stop at summarization. This system must go from signals to insight to action — with the agent doing the reasoning, not the developer scripting the outcome.

---

## Scope

**In scope:**
- One business: TechMart PK (electronics accessories e-commerce)
- One crisis scenario: Product quality defect in a cable batch
- Five data sources: reviews feed, sales data, supplier report, warehouse inventory, market news
- One manager user: the business owner or operations lead
- Mobile app as the manager's command center
- Agent built and orchestrated using Google Antigravity

**Out of scope:**
- Multi-business or SaaS product
- Real payment processing or actual customer notification sending
- Multiple simultaneous active crises
- Historical analytics beyond what is needed for the current scenario

---

## Domain Model

```
TechMart PK
  └── Products (6 SKUs)
        └── CBL-047 (USB-C Cable, Batch B2024-11)
              ├── Reviews          ← DS-01 (real-time stream)
              ├── Sales & Returns  ← DS-02 (CSV, 30 days)
              ├── Supplier Record  ← DS-03 (PDF-equivalent JSON)
              ├── Warehouse Stock  ← DS-04 (table, updated manually)
              └── Market News      ← DS-05 (web article)

Manager
  └── Mobile Dashboard
        ├── Views live agent status and reasoning
        ├── Reviews and approves proposed actions
        └── Reads generated outcome reports

EcomGuard Agent (autonomous)
  └── Watches all five sources
  └── Investigates when signals warrant it
  └── Reasons about contradictions and patterns
  └── Proposes actions to manager
  └── Executes approved actions
  └── Reports outcomes
```

---

## The Five Data Sources

Each source is mock data created for the scenario. All five are available to the agent at all times. The agent decides which to consult and when.

| ID | Source | Type | What it holds |
|----|--------|------|---------------|
| DS-01 | Customer Reviews Feed | Mock real-time JSON stream | 24 reviews over 7 days, including noise |
| DS-02 | Sales & Returns Dashboard | CSV, 30 days | Daily units sold, units returned, return reasons, revenue |
| DS-03 | Supplier Quality Report | JSON (parsed from PDF) | Batch details, failure rate, certifications, external flags |
| DS-04 | Warehouse Inventory Table | JSON table | Stock quantity per SKU, last updated timestamp |
| DS-05 | Market Intelligence Feed | Text (news article) | Industry report mentioning the same supplier |

**The planted contradiction:** DS-02, DS-03, and DS-04 give three different numbers for units of CBL-047 currently available. The agent must discover this on its own, determine which source to trust, and explain why.

**The planted noise in DS-01:** Three of the 24 reviews are not genuine signals — one is spam, one is a duplicate, one is from a customer who purchased a different batch. The agent must identify and exclude them before drawing conclusions.

---

## User Stories

### US-01 — Passive Monitoring
**As a manager**, I want the agent to watch my operations continuously in the background, so I don't have to manually check each source for problems.

**When satisfied:** The manager opens the app at any time and sees the current health status of all five sources and the agent's current state without having to trigger anything.

---

### US-02 — Live Signal Feed
**As a manager demoing the system**, I want to add customer reviews one at a time on my phone and see the agent react to them in real time, so the investigation is observable as it happens.

**When satisfied:** Each review I add appears in the feed within 2 seconds. If it is noise, the agent labels it and excludes it. If it is a valid signal, the agent incorporates it into its analysis.

---

### US-03 — Autonomous Investigation
**As a manager**, I want the agent to investigate the root cause of a signal on its own — checking supplier data, sales trends, and inventory — without me telling it where to look.

**When satisfied:** When concerning reviews arrive, the agent's reasoning log shows it independently consulting DS-02, DS-03, DS-04, and DS-05 in whatever order it deems appropriate. The manager does not trigger this. The agent decides.

---

### US-04 — Visible Reasoning
**As a manager**, I want to see exactly what the agent is thinking as it investigates, in plain English, so I can trust its eventual recommendation.

**When satisfied:** The Agent Reasoning screen shows a live, scrollable log of the agent's observations, questions, discoveries, and decisions as they happen. No raw JSON or technical output visible to the manager.

---

### US-05 — Contradiction Discovery
**As a manager**, I want the agent to tell me when my data sources disagree with each other, which one to trust, and why, so I'm not making decisions on conflicting information without knowing it.

**When satisfied:** The agent surfaces the three-source stock discrepancy, explains why it trusts the sales data over the stale warehouse record, and shows the reconciled figure with an investigation note.

---

### US-06 — Noise Awareness
**As a manager**, I want the agent to separate genuine signals from spam, duplicates, and irrelevant reviews before drawing any conclusions, so a coordinated fake review campaign or an off-batch complaint doesn't trigger a false alarm.

**When satisfied:** The agent identifies and labels each noise review with a specific reason. Its analysis is based only on genuine signals.

---

### US-07 — Proposed Actions with Context
**As a manager**, I want the agent to tell me what it recommends doing, why, what each option costs, and what the risks are if I don't act, so I can make an informed decision rather than just clicking approve.

**When satisfied:** The manager sees a recommended action set with clear plain-English reasoning, estimated cost or impact in PKR where relevant, and a note on why the revenue signal was not used to override the safety concern.

---

### US-08 — Approval Control
**As a manager**, I want to approve or reject high-impact actions before they execute, so the agent doesn't take irreversible actions on my business without my sign-off.

**When satisfied:** Actions affecting external parties (customers, suppliers) or public-facing systems require visible manager approval. Internal operational actions (inventory flags, monitoring triggers) execute automatically with notification.

---

### US-09 — Live Action Execution
**As a manager**, I want to watch each action execute and see the state of the system change in real time after each one, so I have full visibility into what is happening.

**When satisfied:** Each action card transitions through visible states (pending → executing → complete/failed). Every state change shows what changed and what the system looks like after.

---

### US-10 — Failure Handling
**As a manager**, I want to see the agent recover gracefully when an action fails — without the entire process stopping — and tell me what it did instead.

**When satisfied:** When an action fails, the agent retries, then escalates to an alternative recovery path. The remaining actions continue. The manager sees the failure, the recovery decision, and the result.

---

### US-11 — Outcome Summary
**As a manager**, I want a clear before-and-after view of my business state after the agent has acted, so I know what was prevented, what it cost, and what still needs attention.

**When satisfied:** The Outcome Report shows at least 5 metrics comparing pre-crisis and post-response state, a baseline comparison showing how much earlier the agent detected the problem versus a simple alert rule, and any outstanding items requiring manual follow-up.

---

### US-12 — Reset Between Demos
**As a manager presenting at a hackathon**, I want to reset the entire system to its initial state instantly, so I can run the full demo again cleanly for each set of judges.

**When satisfied:** A single reset action clears all reviews, all agent state, and all screen data and returns every screen to its initial state within 3 seconds.

---

## Functional Requirements

### Agent Autonomy

**FR-001** The agent must decide independently which data sources to consult and in what order when investigating a signal. The investigation path must not be pre-scripted by the development team.

**FR-002** The agent must decide independently when it has gathered sufficient evidence to form a conclusion and propose actions. No hardcoded confidence threshold may trigger this decision.

**FR-003** The agent must explain every significant decision it makes in plain English, pushed to the manager's dashboard in real time as the decision is made.

**FR-004** The agent must be capable of concluding "insufficient evidence — continue monitoring" and not proposing actions when signals are ambiguous or weak.

---

### Data Ingestion

**FR-005** The system must make all five data sources accessible to the agent simultaneously. The agent may read any source at any time.

**FR-006** DS-01 reviews must be ingestable both manually (manager adds one review at a time) and via auto-stream mode (pre-built reviews emitted on a timer for demo purposes).

**FR-007** Each data source must carry metadata the agent can access: source type, last updated timestamp, and a basis for credibility assessment.

---

### Noise Filtering

**FR-008** The agent must assess each incoming review for legitimacy before including it in its analysis. Noise categories include: spam (no product-specific content), duplicate (same content, different submitter), and wrong-batch (purchase predates the batch under investigation).

**FR-009** Every review the agent excludes must be labeled with the specific reason for exclusion, visible on the manager dashboard.

**FR-010** The agent's investigation must be based exclusively on reviews it has classified as genuine signals.

---

### Temporal Analysis

**FR-011** The agent must analyze how signals change over time, not just their current state. It must distinguish between an isolated complaint and an escalating pattern.

**FR-012** When the agent identifies a temporal pattern (escalating complaints, rising return rate), it must correlate it with a potential cause — such as a batch arrival date — and state whether the correlation is strong or speculative.

**FR-013** The manager dashboard must display the complaint velocity and return rate as a time-series chart that updates as new reviews arrive.

---

### Contradiction Detection

**FR-014** When the agent finds the same metric reported differently across two or more sources, it must surface this as a contradiction rather than silently picking one value.

**FR-015** The agent must assess each conflicting source based on recency, source type, and reliability and determine which figure to use for its reasoning.

**FR-016** The agent must generate an investigation note explaining the contradiction and recommending a human verification step before high-impact actions are taken.

**FR-017** The contradiction and its resolution must be presented to the manager as a distinct, prominent panel — not buried in the reasoning log.

---

### Insight and Decision

**FR-018** When the agent proposes actions, it must present multiple options where they exist, with the tradeoffs of each stated plainly (e.g., estimated financial impact, risk level, reversibility).

**FR-019** The agent must explicitly state when a positive-looking signal (such as strong revenue) is being discounted because it is identified as a lagging indicator, and explain why.

**FR-020** The agent's recommendation must emerge from its analysis of the evidence. It must not default to a predetermined response category.

---

### Constraint Awareness

**FR-021** The agent must identify applicable business constraints (budget, time, resource availability, API rate limits) before proposing actions and factor them into its recommendations.

**FR-022** When a proposed action conflicts with a constraint, the agent must modify the action to fit within the constraint and explain the modification — not silently drop or ignore the action.

**FR-023** Constraints must be communicated to the manager as part of the action proposal, not hidden.

---

### Manager Approval

**FR-024** Actions that affect external parties (customers, suppliers) or public-facing product state must require explicit manager approval before execution.

**FR-025** Actions that are internal and low-risk (internal flags, monitoring schedules) may execute automatically, but the manager must be notified immediately.

**FR-026** The manager must be able to approve all pending actions at once or individually per action.

**FR-027** The manager must be able to reject any proposed action. When rejected, the agent must acknowledge the rejection, log it, and proceed with remaining approved actions.

---

### Action Execution

**FR-028** Approved actions must execute sequentially with a visible state change shown after each one completes.

**FR-029** If an action fails, the agent must retry at least once before escalating. The manager must see the failure, the retry attempt, and the escalation decision.

**FR-030** A failed action must not stop the execution of remaining actions in the chain unless the failed action is a prerequisite for subsequent ones.

**FR-031** When an action fails and escalates, the agent must produce an alternative output — such as a manual draft — that allows the manager to complete the action without the agent.

---

### Outcome

**FR-032** After the action chain completes, the system must show a before-and-after comparison covering at minimum: product listing status, units at risk, supplier relationship status, customer exposure, and estimated brand risk level.

**FR-033** The outcome must include a baseline comparison: what a simple rule-based alert system would have done and when, versus what EcomGuard did and when.

**FR-034** The agent must define a rollback condition: the specific observable event that would indicate the crisis assessment was incorrect and what the system would restore.

**FR-035** The agent must generate a plain-English incident report suitable for the manager to share with stakeholders.

---

### Real-Time Dashboard

**FR-036** All agent activity must be streamed to the manager's mobile app in real time. The manager must never need to refresh or poll to see updates.

**FR-037** The manager dashboard must show the agent's current operational status at all times: monitoring, investigating, awaiting approval, executing, or resolved.

**FR-038** The connection between the mobile app and the backend must reconnect automatically if dropped, without losing dashboard state.

---

### Google Antigravity

**FR-039** The entire project — backend, mobile app, agent logic, and tooling — must be built using Google Antigravity as the development environment.

**FR-040** The Antigravity Agent Manager workplans, task artifacts, and reasoning traces generated during development must be preserved and submitted as a hackathon deliverable alongside the working prototype.

---

## Non-Functional Requirements

**NFR-001 Observability** — Every agent decision must produce a human-readable log entry on the dashboard. A non-technical judge must be able to follow the agent's reasoning without explanation from the team.

**NFR-002 Demo Reliability** — The full demo scenario must complete successfully in under 5 minutes. The system must support at least 3 consecutive full demo runs without restarting.

**NFR-003 Genuine Reasoning** — The agent's investigation path, conclusions, and action choices must emerge from LLM reasoning over the available data, not from developer-scripted conditional logic. Judges reviewing the agent traces must not be able to identify a hard-coded decision tree.

**NFR-004 Graceful Failure** — No tool failure, API error, or unexpected agent output may crash the app or freeze the dashboard. All error states must be shown to the manager in plain language.

**NFR-005 Mobile-First** — The manager dashboard must be fully functional on a physical mobile device via Expo Go. All screens must be usable on a standard phone screen without horizontal scrolling.

**NFR-006 Reset Fidelity** — A reset must return every screen, every data source state, and every agent variable to its exact initial condition. The post-reset state must be identical to a fresh system start.

---

## Tech Stack

Chosen for natural fit, developer familiarity, and reliable AI code generation — not forced.

| Layer | Choice | Reason |
|-------|--------|--------|
| Build environment | Google Antigravity IDE | Mandatory. Provides agent traces and workplans as hackathon deliverable. |
| Agent framework | openai-agents-python | Developer is comfortable with it. Supports genuine autonomous tool use, handoffs, and built-in tracing. No pre-scripted pipeline needed. |
| LLM | GPT-OSS-120B | Reliable structured reasoning, consistent tool use, fast enough for real-time demo. |
| Backend | FastAPI + Python | Async-native, minimal boilerplate, natural fit with openai-agents-python. |
| Real-time transport | Server-Sent Events (SSE) | Simpler than WebSockets for one-directional server-to-client streaming. No handshake complexity. Native reconnect. |
| Mobile app | Expo (React Native) | No native dev required. Demo via Expo Go QR scan. Most AI-generated React Native code is accurate. |
| State management | Zustand | Minimal boilerplate, works cleanly with SSE event updates. |
| Charts | Victory Native | Best maintained React Native chart library. Supports real-time updates. |
| Mock data | Static JSON and CSV files | Sufficient. No database needed for demo scope. |

---

## Success Criteria

**SC-001** When genuine bad reviews are added, the agent investigates without being prompted and surfaces findings to the dashboard.

**SC-002** When noise reviews are added (spam, duplicate, wrong-batch), the agent identifies and labels them and excludes them from its analysis.

**SC-003** The agent discovers the three-source stock contradiction on its own and presents a resolution with source credibility reasoning.

**SC-004** The agent explicitly discounts the revenue signal as a lagging indicator in its reasoning log.

**SC-005** The agent produces a recommended action set with tradeoffs and constraint analysis that the manager can understand without technical background.

**SC-006** At least one proposed action requires manager approval before execution. The action does not execute until approval is received.

**SC-007** At least one action fails during execution. The agent retries, escalates, and continues the remaining chain without stopping.

**SC-008** The before-and-after outcome shows a measurable improvement in at least 4 metrics.

**SC-009** The baseline comparison demonstrates EcomGuard detecting the crisis earlier than a simple average-rating threshold rule.

**SC-010** A judge unfamiliar with the system can follow the agent's full reasoning on the Agent Reasoning screen without explanation from the team.

**SC-011** The system resets cleanly to initial state and supports a second full demo run immediately.

**SC-012** Antigravity workplans, agent task artifacts, and development traces are available for judge review.

---

## Assumptions

- All five data sources are mock data created specifically for the scenario. Judges are aware of this — the challenge permits it.
- The business constraints (budget limits, notification batching, supplier notice frequency) are defined by the team and embedded in the agent's system context, not hardcoded in logic.
- The agent uses GPT-OSS-120B via the Groq API. Antigravity is the build environment, not the runtime LLM provider.
- "Execution" of actions is simulated — state changes are reflected in the dashboard and reports. No real emails are sent, no real listings are modified.
- The three-source stock contradiction and the noise reviews are planted in the mock data to ensure the scenario is demonstrable within the hackathon timeframe. The agent's response to them is not planted.

---

## Limitations

- The agent is prompted with the business context (company name, product catalog, constraint definitions). It is not operating in a vacuum — it knows what company it serves and what tools it has. It does not know what crisis, if any, is occurring.
- The demo scenario is designed to reliably produce a crisis. Different review inputs may produce different agent behavior — this is intentional and a feature, not a risk.
- No persistent memory between sessions. Each run starts fresh.
- Action execution is simulated. Outcome state exists only in the dashboard.

---

*EcomGuard · Spec v3.0*