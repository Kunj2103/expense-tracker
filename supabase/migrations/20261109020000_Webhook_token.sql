ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS webhook_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_webhook_token
  ON public.user_settings (webhook_token);


CREATE OR REPLACE FUNCTION public.log_transaction_via_token(
  p_token UUID,
  p_type VARCHAR,
  p_amount DECIMAL,
  p_date DATE,
  p_category VARCHAR,
  p_payment_method VARCHAR,
  p_counterparty VARCHAR,
  p_notes TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tx_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.user_settings
  WHERE webhook_token = p_token;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid webhook token');
  END IF;

  INSERT INTO public.transactions (
    user_id, type, amount, date, category, payment_method, counterparty, notes
  ) VALUES (
    v_user_id, p_type, p_amount, p_date, p_category, p_payment_method, p_counterparty, p_notes
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'id', v_tx_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_transaction_via_token TO anon, authenticated;