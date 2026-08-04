# EcomGuard — Autonomous Product Crisis Intelligence Agent

<div align="center">

![EcomGuard](https://img.shields.io/badge/EcomGuard-Crisis%20Intelligence-5B4FE8?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)

**An autonomous AI agent that monitors 5 operational data sources, detects product crises, surfaces contradictions, and proposes actions — all in real-time.**

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Demo Scenario](#demo-scenario) • [API Docs](#api-documentation)

</div>

---

## 🎯 What is EcomGuard?

EcomGuard is a **spec-driven development showcase** demonstrating how an autonomous AI agent can:

- ✅ **Monitor** 5 heterogeneous data sources (reviews, sales, supplier reports, inventory, news)
- ✅ **Classify** customer reviews as genuine signals vs. noise (spam, duplicates, wrong batch)
- ✅ **Detect** temporal patterns and escalating complaint frequencies
- ✅ **Cross-reference** data sources to build a complete crisis picture
- ✅ **Surface contradictions** when the same metric is reported differently across sources
- ✅ **Propose actions** with cost estimates, risk levels, and business constraint awareness
- ✅ **Execute actions** with retry logic, failure handling, and escalation
- ✅ **Generate outcome reports** with before/after metrics and baseline comparisons

**The Scenario:** A Pakistani e-commerce business (TechMart PK) sells a USB-C cable (SKU CBL-047, Batch B2024-11) with a connector overheating defect. The agent autonomously discovers this crisis from customer reviews, investigates, and proposes a response plan.

---

## ✨ Features

### 🤖 Autonomous Agent
- **Groq-powered LLM** (GPT-OSS-120B) via the OpenAI Agents SDK — one-line switch to Gemini via `LLM_PROVIDER`
- **9 function tools** for data reading, classification, reasoning, and action proposal
- **Real-time reasoning log** streamed to the dashboard via SSE
- **Contradiction detection** with source credibility assessment
- **Business constraint awareness** (budget, notification limits, supplier cooldown)

### 📱 Mobile Dashboard (React Native + Expo)
- **5 screens:** Dashboard, Live Feed, Agent Reasoning, Actions, Outcome Report
- **Real-time updates** via Server-Sent Events (SSE)
- **Cross-platform:** iOS, Android, Web
- **Modern design** inspired by premium mobile apps (warm neutrals, clean cards, smooth animations)

### 🔄 Action Execution Engine
- **Sequential execution** with state transitions
- **Retry logic** (1 retry per action)
- **Deliberate failure** (supplier contact fails first attempt, succeeds on retry)
- **Escalation** with manual fallback drafts
- **Outcome report** auto-generated after execution

### 📊 Data Sources
1. **DS-01:** Customer Reviews (real-time feed)
2. **DS-02:** Sales & Returns (30-day CSV)
3. **DS-03:** Supplier Quality Report (PDF-parsed JSON)
4. **DS-04:** Warehouse Inventory (manual table)
5. **DS-05:** Market News (industry articles)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Dashboard                          │
│  (React Native + Expo + Zustand + SSE)                      │
│  ┌──────┬──────┬──────────┬─────────┬────────┐             │
│  │ Dash │ Feed │ Reasoning│ Actions │ Report │             │
│  └──────┴──────┴──────────┴─────────┴────────┘             │
└────────────────────┬────────────────────────────────────────┘
                     │ REST + SSE
┌────────────────────▼────────────────────────────────────────┐
│                  FastAPI Backend                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes: /api/reviews, /api/agent, /api/actions,    │   │
│  │          /api/state, /events (SSE)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  EcomGuard Agent (openai-agents SDK + Groq)         │   │
│  │  • 9 function tools                                  │   │
│  │  • Autonomous investigation                          │   │
│  │  • Action proposal + execution                       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  In-Memory State (AppState singleton)               │   │
│  │  • 5 data sources (JSON/CSV)                         │   │
│  │  • Reviews, reasoning log, contradictions, actions  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (with `uv` or `pip`)
- **Node.js 18+** (with `pnpm`, `npm`, or `yarn`)
- **Groq API Key** ([Get one free](https://console.groq.com/keys))

### 1. Clone & Setup Backend

```bash
# Clone the repo
git clone <your-repo-url>
cd EcomGuard

# Install Python dependencies (using uv)
uv pip install -e .

# Or using pip
pip install -e .

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 2. Start Backend

```bash
# From project root — the app module is backend.main:app
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Backend runs on http://localhost:8000
# API docs: http://localhost:8000/docs
```

> On WSL/Linux, if a stale Windows `.venv` exists, create a fresh one:
> `uv venv .venv && source .venv/bin/activate && uv pip install -e .`

### 3. Setup Mobile App

```bash
# From project root
cd mobile

# Install dependencies
npm install
# or: pnpm install

# API URL is auto-detected from Expo for physical devices.
# Only set mobile/.env EXPO_PUBLIC_API_URL if auto-detection can't reach
# your backend (see mobile/.env for the template).
```

### 4. Start Mobile App

```bash
# From mobile/ directory

# For web
pnpm start --web

# For iOS (requires Mac + Xcode)
pnpm start --ios

# For Android (requires Android Studio)
pnpm start --android

# Or scan QR code with Expo Go app
pnpm start
```

---

## 🎬 Demo Scenario

### Step 1: Auto-Stream Reviews
1. Open the **Feed** tab
2. Tap **▶ Auto-Stream** (or type reviews in manually, one at a time)
3. Watch 24 pre-built customer reviews stream in at 2-second intervals — including 3 planted noise reviews (spam, duplicate, wrong-batch)

### Step 2: Agent Investigation
- After 5+ reviews are ingested, the agent **automatically triggers** an investigation (no prompt needed)
- Switch to the **Reasoning** tab to watch the agent's thought process in real-time:
  - Classifies each review (genuine vs. spam/duplicate/wrong-batch) and excludes the noise
  - Chooses which sources to consult and reads them (you see each "Consulting …" step)
  - Detects the escalating complaint/return pattern over time
  - Surfaces the three-source stock contradiction and explains which source it trusts
  - Discounts the still-positive revenue signal as a lagging indicator
  - Proposes ~5 actions with rationale, tradeoffs, cost estimates, and risk levels

### Step 3: Approve & Execute Actions
1. Switch to the **Actions** tab
2. Review proposed actions. Internal low-risk ones (inventory flag, monitoring) are **auto-approved**; external ones need your sign-off:
   - Pause product listing (needs approval)
   - Flag inventory for quarantine (auto-approved)
   - Notify affected customers (needs approval)
   - Contact supplier (needs approval — **fails, retries, then escalates to a manual draft**)
   - Enable enhanced monitoring (auto-approved)
3. Tap **✓ Approve All**
4. Tap **▶ Execute**
5. Watch actions execute sequentially with real-time status transitions (pending → executing → complete/escalated)

### Step 4: View Outcome Report
- Switch to the **Report** tab
- See before/after metrics, execution summary, baseline comparison, rollback conditions, and outstanding items

### Step 5: Reset & Repeat
- Tap the **↺** button on the Dashboard to reset the entire system
- All data returns to pristine initial state in <3 seconds

---

## 📡 API Documentation

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Detailed health |
| `GET` | `/api/state` | Full state snapshot |
| `POST` | `/api/reset` | Reset system |
| `GET` | `/api/reviews` | List ingested reviews |
| `POST` | `/api/reviews` | Add single review |
| `POST` | `/api/reviews/auto-stream` | Start auto-streaming |
| `POST` | `/api/reviews/stop-stream` | Stop auto-streaming |
| `GET` | `/api/agent/status` | Agent status |
| `POST` | `/api/agent/investigate` | Trigger investigation |
| `GET` | `/api/agent/reasoning` | Reasoning log |
| `GET` | `/api/agent/contradictions` | Contradictions |
| `GET` | `/api/actions/proposed` | Proposed actions |
| `POST` | `/api/actions/{id}/approve` | Approve action |
| `POST` | `/api/actions/{id}/reject` | Reject action |
| `POST` | `/api/actions/approve-all` | Approve all |
| `POST` | `/api/actions/execute` | Execute approved |
| `GET` | `/api/actions/results` | Execution results |
| `GET` | `/api/outcome` | Outcome report |

### SSE Stream

**Endpoint:** `GET /events`

**Event Types:**
- `connected` — Initial connection
- `agent_status` — Agent state change
- `review_added` — New review ingested
- `review_classified` — Review classification
- `reasoning` — Agent reasoning entry
- `contradiction_found` — Data contradiction
- `actions_proposed` — Actions proposed
- `action_executing` — Action started
- `action_complete` — Action succeeded
- `action_failed` — Action failed
- `action_escalated` — Action escalated
- `outcome_report` — Report generated
- `reset` — System reset

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** 0.115+ (async Python web framework)
- **openai-agents** SDK (single autonomous agent, function tools, streaming)
- **Groq** GPT-OSS-120B via the OpenAI-compatible API (Gemini switchable via `LLM_PROVIDER`)
- **sse-starlette** (Server-Sent Events streaming)
- **Pydantic** 2.0+ (data validation)
- **python-dotenv** (environment variables)

### Frontend
- **Expo** 54 (React Native framework)
- **React Native** 0.81.5
- **React** 19.1
- **Zustand** 4.5 (state management)
- **react-native-sse** 1.2 (SSE client for native)
- **react-native-svg** 15 (the live complaint-velocity chart)
- **expo-router** 6 (file-based navigation)

---

## 📂 Project Structure

```
EcomGuard/
├── backend/
│   ├── main.py                 # FastAPI app entry
│   ├── config.py               # Settings
│   ├── state.py                # In-memory state
│   ├── event_bus.py            # SSE pub/sub
│   ├── agent/
│   │   ├── ecomguard_agent.py  # Autonomous agent + investigation runner
│   │   ├── model_provider.py   # Groq / Gemini provider switch
│   │   ├── prompts.py          # System prompt
│   │   ├── tools.py            # 10 function tools
│   │   └── actions.py          # Execution engine
│   ├── routes/
│   │   ├── events.py           # SSE endpoint
│   │   ├── reviews.py          # Review routes
│   │   ├── agent.py            # Agent routes
│   │   ├── actions.py          # Action routes
│   │   └── state.py            # State routes
│   └── data/
│       ├── ds01_reviews.json
│       ├── ds02_sales_returns.csv
│       ├── ds03_supplier_report.json
│       ├── ds04_warehouse_inventory.json
│       └── ds05_market_news.json
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx         # Root layout
│   │   └── (tabs)/
│   │       ├── _layout.tsx     # Tab layout
│   │       ├── index.tsx       # Dashboard
│   │       ├── feed.tsx        # Live Feed
│   │       ├── reasoning.tsx   # Agent Reasoning
│   │       ├── actions.tsx     # Actions
│   │       └── report.tsx      # Outcome Report
│   ├── components/             # 8 custom components
│   ├── store/                  # Zustand store
│   ├── hooks/                  # useSSE, useApi
│   ├── types/                  # TypeScript types
│   ├── constants/              # Theme, data sources
│   └── config/                 # API URL
├── .env                        # Backend environment
├── .env.example                # Template
├── pyproject.toml              # Python deps
└── README.md                   # This file
```

---

## 🎨 Design System

The mobile app uses a **warm, modern design system** inspired by premium mobile apps:

- **Colors:** Warm cream background (#F5F0EB), white cards, deep indigo accent (#5B4FE8)
- **Typography:** System fonts with 8 size scales (xs to hero)
- **Spacing:** 4px base unit (xs to xxl)
- **Border Radius:** 6px to 28px (xs to xl)
- **Shadows:** 3 elevation levels (sm, md, lg)
- **Animations:** Reanimated 4 for smooth, native-feeling interactions

---

## 🧪 Testing the Agent

### Manual Review Input
```bash
curl -X POST http://localhost:8000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The USB-C connector gets extremely hot during charging!",
    "rating": 1,
    "reviewer": "TestUser"
  }'
```

### Force Investigation
```bash
curl -X POST http://localhost:8000/api/agent/investigate
```

### Reset System
```bash
curl -X POST http://localhost:8000/api/reset
```

---

## 🔧 Configuration

### Backend (.env)
```bash
# Provider switch: groq (spec default, GPT-OSS-120B) or gemini
LLM_PROVIDER=groq
# Leave MODEL_NAME blank to use the provider default
# (groq -> openai/gpt-oss-120b, gemini -> gemini-2.0-flash)
MODEL_NAME=
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=          # optional; must start with AIza (Google AI Studio)
PORT=8000
```

> **Groq free-tier note:** the free tier caps at 8,000 tokens/min and
> 200,000 tokens/day. A full investigation uses ~30k tokens and streams over
> ~2–4 min while throttled. For snappier demos or many repeats, upgrade the
> Groq key to a paid tier, or flip `LLM_PROVIDER=gemini` with a valid AI
> Studio key.

### Mobile (mobile/.env)
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

**Note:** Replace `192.168.1.100` with your machine's local IP address. Find it with:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr` (look for inet)

---

## 🐛 Troubleshooting

### Backend won't start
- ✅ Check Python version: `python --version` (must be 3.11+)
- ✅ Verify GROQ_API_KEY in `.env`
- ✅ Install dependencies: `uv pip install -e .`

### Mobile app can't connect to backend
- ✅ Check backend is running: `curl http://localhost:8000/health`
- ✅ Verify `EXPO_PUBLIC_API_URL` in `mobile/.env` uses your local IP (not `localhost`)
- ✅ Ensure phone/emulator is on the same network as your computer
- ✅ Check firewall isn't blocking port 8000

### SSE not working
- ✅ Check browser console for SSE connection errors
- ✅ Verify `/events` endpoint is accessible: `curl http://localhost:8000/events`
- ✅ On native, ensure `react-native-sse` is installed

### Agent not investigating
- ✅ Ensure 5+ reviews are ingested (auto-trigger threshold)
- ✅ Check agent status: `curl http://localhost:8000/api/agent/status`
- ✅ Manually trigger: `curl -X POST http://localhost:8000/api/agent/investigate`

### Investigation is slow or errors with "rate limit" / 429
- The Groq free tier caps at 8,000 tokens/min and 200,000 tokens/day. Under the
  minute cap a full investigation streams over ~2–4 min (this is expected and is
  shown live on the dashboard). A 429 means the daily cap is spent — wait for the
  reset, use a second key, upgrade to a paid Groq tier, or set `LLM_PROVIDER=gemini`
  with a valid Google AI Studio key (must start with `AIza`).
- Any provider error is surfaced on the dashboard in plain language and never
  crashes the app (NFR-004).

---

## 📝 License

MIT License — see LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenAI Agents SDK** for the agent framework
- **Groq** for fast LLM inference
- **Expo** for the amazing React Native developer experience
- **FastAPI** for the elegant Python web framework

---

<div align="center">

**Built with ❤️ as a spec-driven development showcase**

[Report Bug](https://github.com/yourusername/ecomguard/issues) • [Request Feature](https://github.com/yourusername/ecomguard/issues)

</div>
