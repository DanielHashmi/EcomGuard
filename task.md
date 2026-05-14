# EcomGuard — Task Tracker

## Phase 1: Mock Data Sources
- [/] DS-01: Customer Reviews Feed (ds01_reviews.json)
- [ ] DS-02: Sales & Returns Dashboard (ds02_sales_returns.csv)
- [ ] DS-03: Supplier Quality Report (ds03_supplier_report.json)
- [ ] DS-04: Warehouse Inventory (ds04_warehouse_inventory.json)
- [ ] DS-05: Market Intelligence (ds05_market_news.json)

## Phase 2: Backend Core
- [ ] pyproject.toml + .env + .env.example
- [ ] backend/config.py
- [ ] backend/state.py
- [ ] backend/event_bus.py
- [ ] backend/main.py

## Phase 3: Agent System
- [ ] backend/agent/model_provider.py
- [ ] backend/agent/prompts.py
- [ ] backend/agent/tools.py
- [ ] backend/agent/ecomguard_agent.py
- [ ] backend/agent/actions.py

## Phase 4: API Routes
- [ ] backend/routes/events.py (SSE)
- [ ] backend/routes/reviews.py
- [ ] backend/routes/agent.py
- [ ] backend/routes/actions.py
- [ ] backend/routes/state.py

## Phase 5: Expo Project Setup
- [ ] Create Expo project
- [ ] Install dependencies (zustand, victory-native, etc.)
- [ ] Configure app.json + env

## Phase 6: Mobile Store & Hooks
- [ ] types/index.ts
- [ ] constants/theme.ts
- [ ] store/useEcomGuardStore.ts
- [ ] hooks/useSSE.ts
- [ ] hooks/useApi.ts

## Phase 7: Mobile Screens & Components
- [ ] Root layout + tab navigation
- [ ] Dashboard tab (index.tsx)
- [ ] Live Feed tab (feed.tsx)
- [ ] Agent Reasoning tab (reasoning.tsx)
- [ ] Actions tab (actions.tsx)
- [ ] Outcome Report tab (report.tsx)
- [ ] Components (AgentStatusBadge, ReviewCard, ActionCard, etc.)

## Phase 8: Action Execution Engine
- [ ] Sequential execution with state transitions
- [ ] Retry + failure + escalation logic
- [ ] Deliberate supplier contact failure

## Phase 9: Outcome Report
- [ ] Before/after metrics generation
- [ ] Baseline comparison logic
- [ ] Incident report generator

## Phase 10: Polish & Documentation
- [ ] README.md
- [ ] End-to-end test run
- [ ] Verify reset functionality
