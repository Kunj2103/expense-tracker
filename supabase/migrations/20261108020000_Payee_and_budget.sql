BEGIN;

-- 1. Add counterparty (Payee / Sender name) to transactions & recurring_rules
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS counterparty VARCHAR(120);

ALTER TABLE public.recurring_rules
  ADD COLUMN IF NOT EXISTS counterparty VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_transactions_user_counterparty
  ON public.transactions (user_id, counterparty);

-- 2. Create user_settings table for Monthly Budget Limit & Cutoff %
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_budget DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (monthly_budget >= 0),
  alert_threshold_percent INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold_percent BETWEEN 10 AND 100),
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own settings" ON public.user_settings;

CREATE POLICY "Users manage own settings"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
REVOKE ALL ON public.user_settings FROM anon;

COMMIT;