import { DataSourceHealth } from '../types';

export const DEFAULT_DATA_SOURCES: DataSourceHealth[] = [
  {
    id: 'DS-01',
    name: 'Customer Reviews',
    type: 'real-time feed',
    last_updated: '2024-11-28T14:30:00Z',
    credibility: 'direct_customer_feedback',
  },
  {
    id: 'DS-02',
    name: 'Sales & Returns',
    type: 'CSV 30-day',
    last_updated: '2024-11-28T23:59:00Z',
    credibility: 'internal_transaction_data',
  },
  {
    id: 'DS-03',
    name: 'Supplier Report',
    type: 'PDF-parsed JSON',
    last_updated: '2024-11-15T00:00:00Z',
    credibility: 'supplier_self_reported',
  },
  {
    id: 'DS-04',
    name: 'Warehouse Inventory',
    type: 'manual table',
    last_updated: '2024-11-23T08:00:00Z',
    credibility: 'internal_manual_entry',
  },
  {
    id: 'DS-05',
    name: 'Market News',
    type: 'news article',
    last_updated: '2024-11-26T10:00:00Z',
    credibility: 'industry_blog_medium',
  },
];
