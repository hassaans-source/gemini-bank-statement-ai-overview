export type TransactionType = 'credit' | 'debit';

export interface BankStatementTransaction {
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
}

export interface BankStatementCategory {
  name: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface BankStatementResult {
  status: 'success' | 'error';
  reference_id: string;
  period_label: string;
  currency: string;
  opening_balance: number;
  closing_balance: number;
  total_credit: number;
  total_debit: number;
  summary: string;
  summary_ur: string;
  categories: BankStatementCategory[];
  transactions: BankStatementTransaction[];
  message?: string;
}

export interface SavedStatement {
  id: string;
  created_at: string;
  file_name: string;
  period_label: string;
  currency: string;
  closing_balance: number;
  total_debit: number;
  total_credit: number;
  result: BankStatementResult;
}

export interface BudgetOverride {
  category: string;
  amount: number;
}

export interface AppSettings {
  webhook_url: string;
  api_key?: string;
  company_name: string;
  low_balance_threshold: number | null;
  supabase_url?: string;
  supabase_anon_key?: string;
}

export type WebhookStatus = 'untested' | 'connected' | 'error';

export interface AlertItem {
  id: string;
  type: 'spending_high' | 'category_spike' | 'large_payment' | 'duplicate_payment' | 'low_balance';
  title: string;
  title_ur: string;
  description: string;
  description_ur: string;
  severity: 'warning' | 'alert' | 'info';
}

export type AppLanguage = 'en' | 'ur';
export type AppTheme = 'light' | 'dark';
export type ActiveTab = 'dashboard' | 'history' | 'settings';
export type DashboardMode = 'upload' | 'processing' | 'results' | 'error';
