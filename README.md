# EcomGuard

<p align="center">
  <img src="public/thumbnail.png" alt="EcomGuard manager dashboard" width="900" />
</p>

<p align="center">
  Autonomous product-crisis intelligence for e-commerce operations.
</p>

<p align="center">
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white" alt="Python 3.11+"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white" alt="FastAPI 0.115+"></a>
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white" alt="Expo 57"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.86.3-61DAFB?logo=react&logoColor=20232A" alt="React Native 0.86.3"></a>
</p>

EcomGuard is a full-stack demonstration of an autonomous AI agent that monitors operational signals, investigates emerging product issues, explains conflicting evidence, and proposes controlled response actions through a real-time manager dashboard.

The included scenario follows TechMart PK and a USB-C cable product (`CBL-047`, batch `B2024-11`) with a simulated overheating defect.

## Capabilities

- Monitors five local operational sources: customer reviews, sales and returns, supplier quality, warehouse inventory, and market news.
- Classifies reviews as genuine, spam, duplicate, or wrong-batch before using them as evidence.
- Detects time-based complaint patterns and contradictions between sources.
- Streams agent reasoning, action state, and outcome updates over Server-Sent Events (SSE).
- Proposes actions with rationale, risk, estimated cost, approval requirements, retries, and escalation handling.
- Provides a cross-platform Expo dashboard for web, Android, and iOS.

## Architecture

```text
Expo / React Native dashboard
        │ REST + SSE
        ▼
FastAPI backend
  ├─ REST route modules
  ├─ EcomGuard agent and function tools
  ├─ action execution and outcome reporting
  └─ in-memory application state
        │
        ▼
Local JSON and CSV scenario data
```

The backend is intentionally stateless between process restarts: dashboard state is held in memory and can be restored to the initial scenario with `POST /api/reset`.

## Quick start

### Requirements

- Python 3.11 or newer
- Node.js 18 or newer
- `uv` for the Python environment
- `pnpm` for the mobile workspace
- An API key for the selected model provider: Groq by default, or Gemini

### 1. Configure and install the backend

From the repository root:

```bash
uv sync
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Add a `GROQ_API_KEY` to `.env`, or set `LLM_PROVIDER=gemini` and provide `GEMINI_API_KEY`.

### 2. Start the backend

```bash
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The API is available at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

### 3. Install and start the dashboard

In a second terminal:

```bash
cd mobile
pnpm install
pnpm start
```

Use the Expo CLI to open a platform, or use the package scripts directly:

```bash
pnpm run web
pnpm run android
pnpm run ios
```

The web client defaults to `http://localhost:8000`. Native clients derive the host from Expo. If a physical device cannot reach the backend, copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL` to the computer's LAN address.

Windows users can also use `setup-env.bat`, `start-backend.bat`, and `start-mobile.bat` from the repository root.

## Demo flow

1. Open the Feed tab and start Auto-Stream, or add reviews manually.
2. After five reviews, the backend automatically begins an investigation.
3. Review classifications, evidence, contradictions, and reasoning in the dashboard.
4. Review proposed actions, approve the required actions, and execute them.
5. Inspect the outcome report, then reset the scenario from the Dashboard tab.

The scenario contains 24 seeded reviews and a deliberate supplier-contact retry/escalation path for demonstrating failure handling.

## API surface

| Area | Endpoints |
| --- | --- |
| Health | `GET /`, `GET /health` |
| State | `GET /api/state`, `POST /api/reset`, `GET /api/outcome` |
| Reviews | `GET /api/reviews`, `POST /api/reviews`, `POST /api/reviews/auto-stream`, `POST /api/reviews/stop-stream` |
| Agent | `GET /api/agent/status`, `POST /api/agent/investigate`, `GET /api/agent/reasoning`, `GET /api/agent/contradictions` |
| Actions | `GET /api/actions/proposed`, `POST /api/actions/{id}/approve`, `POST /api/actions/{id}/reject`, `POST /api/actions/approve-all`, `POST /api/actions/execute`, `GET /api/actions/results` |
| Events | `GET /events` — SSE stream for dashboard updates |

The SSE stream publishes connection, review, reasoning, contradiction, agent-status, action, outcome, reset, and error events.

## Configuration

Backend settings are read from the root `.env` file:

| Variable | Purpose | Default |
| --- | --- | --- |
| `LLM_PROVIDER` | `groq` or `gemini` | `groq` |
| `MODEL_NAME` | Optional explicit model override | Provider default |
| `GROQ_API_KEY` | Groq credential | — |
| `GEMINI_API_KEY` | Gemini credential when selected | — |
| `PORT` | Backend port | `8000` |

Additional business constraints and provider defaults are defined in `backend/config.py`. Never commit `.env` or API keys.

## Repository layout

```text
EcomGuard/
├── backend/
│   ├── agent/                 Agent, provider adapter, tools, and action engine
│   ├── data/                  Seed JSON and CSV scenario sources
│   ├── routes/                FastAPI route modules and SSE endpoint
│   ├── config.py              Environment-backed settings
│   ├── event_bus.py           In-process event pub/sub
│   ├── main.py                FastAPI application entrypoint
│   └── state.py               In-memory state and reset behavior
├── mobile/
│   ├── app/                   Expo Router screens and tab navigation
│   ├── components/            Dashboard UI components
│   ├── config/, hooks/        API and SSE integration
│   ├── constants/, store/     Theme, source metadata, and Zustand state
│   └── types/                 Shared TypeScript interfaces
├── tests/                     Backend smoke tests
├── .env.example               Backend configuration template
├── mobile/.env.example        Optional native dashboard configuration
├── pyproject.toml             Python package and dependency metadata
├── uv.lock                    Locked Python dependency resolution
├── thumbnail.png              README project preview
└── README.md                  Project documentation
```

Supporting specifications and planning material remain in the repository root: `spec.md`, `feature-dependency.md`, `implementation_plan.md`, and `submission-requirements.md`.

## Validation

Run the backend smoke tests and compile check from the repository root:

```bash
uv run pytest
uv run python -m compileall -q backend
```

Validate the mobile TypeScript project from `mobile/`:

```bash
pnpm exec tsc --noEmit
```

## License

This repository does not currently include a license.
