export type AgentStatus = 
  | 'idle' 
  | 'monitoring' 
  | 'investigating' 
  | 'awaiting_approval' 
  | 'executing' 
  | 'resolved';

export interface Review {
  id: string;
  reviewer: string;
  rating: number;
  date: string;
  purchase_date: string;
  batch: string;
  text: string;
  classification?: string;
  classification_reason?: string;
  is_noise?: boolean;
}

export interface ReasoningEntry {
  id: string;
  category: 'observation' | 'question' | 'discovery' | 'decision' | 'warning';
  message: string;
  timestamp: string;
}

export interface Contradiction {
  id: string;
  metric_name: string;
  sources_involved: string;
  values_found: string;
  trusted_source: string;
  trusted_value: string;
  reasoning: string;
  recommendation: string;
  discovered_at: string;
}

export interface Action {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_cost_pkr: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  auto_approved?: boolean;
  rationale?: string;
  tradeoffs?: string;
  constraint_notes: string;
  revenue_note?: string;
  urgency: string;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'complete' | 'escalated' | 'failed';
  proposed_at: string;
}

export interface ActionResult {
  action_id: string;
  status: string;
  attempt: number;
  success?: boolean;
  message?: string;
  details?: string;
  state_change?: any;
  original_error?: string;
  fallback?: any;
}

export interface DataSourceHealth {
  id: string;
  name: string;
  type: string;
  last_updated: string;
  credibility: string;
}

export interface OutcomeReport {
  generated_at: string;
  crisis_summary: string;
  metrics: Record<string, { before: string; after: string; improvement: string }>;
  baseline_comparison: Record<string, string>;
  rollback_condition: { trigger: string; observable_event: string; restore_action: string };
  outstanding_items: string[];
  incident_report?: string;
  actions_summary: { total: number; successful: number; escalated: number; failed: number };
}
