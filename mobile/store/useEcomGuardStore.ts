import { create } from 'zustand';
import { AgentStatus, Review, ReasoningEntry, Contradiction, Action, ActionResult, DataSourceHealth, OutcomeReport } from '../types';
import { DEFAULT_DATA_SOURCES } from '../constants/dataSources';

const REASONING_CATEGORIES = new Set(['observation', 'question', 'discovery', 'decision', 'warning']);

const normalizeReasoningEntry = (entry: any): ReasoningEntry => ({
  id: entry?.id || `LOG-${Date.now()}`,
  category: REASONING_CATEGORIES.has(entry?.category) ? entry.category : 'observation',
  message: entry?.message || entry?.thought || '',
  timestamp: entry?.timestamp || new Date().toISOString(),
});

interface EcomGuardState {
  // Connection
  isConnected: boolean;
  setConnected: (status: boolean) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  apiStatus: 'checking' | 'online' | 'offline';
  setApiStatus: (status: 'checking' | 'online' | 'offline') => void;
  sseStatus: 'connecting' | 'online' | 'offline';
  setSseStatus: (status: 'connecting' | 'online' | 'offline') => void;
  
  // Agent
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;
  investigationStarted: boolean;
  setInvestigationStarted: (started: boolean) => void;
  
  // Reviews
  reviews: Review[];
  setReviews: (reviews: Review[]) => void;
  addReview: (review: Review) => void;
  updateReviewClassification: (id: string, classification: string, reason: string) => void;
  
  // Reasoning
  reasoningLog: ReasoningEntry[];
  setReasoningLog: (log: ReasoningEntry[]) => void;
  addReasoningEntry: (entry: ReasoningEntry) => void;
  
  // Contradictions
  contradictions: Contradiction[];
  setContradictions: (contradictions: Contradiction[]) => void;
  addContradiction: (contradiction: Contradiction) => void;
  
  // Actions
  proposedActions: Action[];
  setProposedActions: (actions: Action[]) => void;
  addProposedAction: (action: Action) => void;
  updateActionStatus: (id: string, status: Action['status']) => void;
  
  executedActions: ActionResult[];
  setExecutedActions: (results: ActionResult[]) => void;
  addExecutedAction: (result: ActionResult) => void;
  
  // Outcome
  outcomeReport: OutcomeReport | null;
  setOutcomeReport: (report: OutcomeReport | null) => void;
  
  // Data Sources
  dataSources: DataSourceHealth[];
  setDataSources: (sources: DataSourceHealth[]) => void;
  
  // App Actions
  loadState: (stateSnapshot: any) => void;
  reset: () => void;
}

export const useEcomGuardStore = create<EcomGuardState>((set) => ({
  isConnected: false,
  setConnected: (status) => set({ isConnected: status }),
  errorMessage: null,
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  apiStatus: 'checking',
  setApiStatus: (status) => set({ apiStatus: status }),
  sseStatus: 'connecting',
  setSseStatus: (status) => set({ sseStatus: status }),
  
  agentStatus: 'monitoring',
  setAgentStatus: (status) => set({ agentStatus: status }),
  investigationStarted: false,
  setInvestigationStarted: (started) => set({ investigationStarted: started }),
  
  reviews: [],
  setReviews: (reviews) => set({ reviews }),
  addReview: (review) => set((state) => ({
    reviews: state.reviews.some(r => r.id === review.id)
      ? state.reviews.map(r => r.id === review.id ? { ...r, ...review } : r)
      : [...state.reviews, review],
  })),
  updateReviewClassification: (id, classification, reason) => set((state) => ({
    reviews: state.reviews.map(r => r.id === id ? { ...r, classification, classification_reason: reason } : r)
  })),
  
  reasoningLog: [],
  setReasoningLog: (log) => set({ reasoningLog: log.map(normalizeReasoningEntry) }),
  addReasoningEntry: (entry) => set((state) => ({ reasoningLog: [...state.reasoningLog, normalizeReasoningEntry(entry)] })),
  
  contradictions: [],
  setContradictions: (contradictions) => set({ contradictions }),
  addContradiction: (contradiction) => set((state) => ({ contradictions: [...state.contradictions, contradiction] })),
  
  proposedActions: [],
  setProposedActions: (actions) => set({ proposedActions: actions }),
  addProposedAction: (action) => set((state) => ({
    proposedActions: state.proposedActions.some(a => a.id === action.id)
      ? state.proposedActions.map(a => a.id === action.id ? { ...a, ...action } : a)
      : [...state.proposedActions, action],
  })),
  updateActionStatus: (id, status) => set((state) => ({
    proposedActions: state.proposedActions.map(a => a.id === id ? { ...a, status } : a)
  })),
  
  executedActions: [],
  setExecutedActions: (results) => set({ executedActions: results }),
  addExecutedAction: (result) => set((state) => ({
    executedActions: [...state.executedActions.filter(a => a.action_id !== result.action_id), result]
  })),
  
  outcomeReport: null,
  setOutcomeReport: (report) => set({ outcomeReport: report }),
  
  dataSources: DEFAULT_DATA_SOURCES,
  setDataSources: (sources) => set({ dataSources: sources }),
  
  loadState: (snapshot) => set((state) => {
    // Transform snapshot into local state
    const reviews = snapshot.ingested_reviews || [];
    
    return {
      agentStatus: snapshot.agent_status || 'monitoring',
      investigationStarted: snapshot.investigation_started || false,
      reviews: reviews,
      reasoningLog: (snapshot.reasoning_log || []).map(normalizeReasoningEntry),
      contradictions: snapshot.contradictions || [],
      proposedActions: snapshot.proposed_actions || [],
      executedActions: snapshot.executed_actions || [],
      outcomeReport: snapshot.outcome_report || null,
      dataSources: snapshot.data_sources?.length ? snapshot.data_sources : DEFAULT_DATA_SOURCES,
    };
  }),
  
  reset: () => set({
    agentStatus: 'monitoring',
    investigationStarted: false,
    reviews: [],
    reasoningLog: [],
    contradictions: [],
    proposedActions: [],
    executedActions: [],
    outcomeReport: null,
    dataSources: DEFAULT_DATA_SOURCES,
  }),
}));
