export type TransactionType = "INCOME" | "EXPENSE";
export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  payment_method: string | null;
  counterparty: string | null;
  notes: string | null;
  recurring_rule_id: string | null;
  created_at: string;
};

export type RecurringRule = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  payment_method: string | null;
  counterparty: string | null;
  notes: string | null;
  frequency: RecurringFrequency;
  next_run_date: string;
  is_active: boolean;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  monthly_budget: number;
  alert_threshold_percent: number;
  push_enabled: boolean;
  updated_at?: string;
};

export type CounterpartySuggestion = {
  counterparty: string;
  category: string;
  payment_method: string | null;
};

export type DashboardStats = {
  totalEarned: number;
  totalSpent: number;
  remainingBalance: number;
};

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          date: string;
          category: string;
          payment_method?: string | null;
          counterparty?: string | null;
          notes?: string | null;
          recurring_rule_id?: string | null;
          created_at?: string;
        };
        Update: {
          type?: TransactionType;
          amount?: number;
          date?: string;
          category?: string;
          payment_method?: string | null;
          counterparty?: string | null;
          notes?: string | null;
          recurring_rule_id?: string | null;
        };
        Relationships: [];
      };
      recurring_rules: {
        Row: RecurringRule;
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category: string;
          payment_method?: string | null;
          counterparty?: string | null;
          notes?: string | null;
          frequency: RecurringFrequency;
          next_run_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          type?: TransactionType;
          amount?: number;
          category?: string;
          payment_method?: string | null;
          counterparty?: string | null;
          notes?: string | null;
          frequency?: RecurringFrequency;
          next_run_date?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      user_settings: {
        Row: UserSettings;
        Insert: {
          user_id: string;
          monthly_budget?: number;
          alert_threshold_percent?: number;
          push_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          monthly_budget?: number;
          alert_threshold_percent?: number;
          push_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};