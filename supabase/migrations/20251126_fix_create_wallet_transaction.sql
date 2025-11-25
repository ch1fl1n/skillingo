-- Fix ambiguous column references in create_wallet_transaction RPC
-- Replaces the function with a version that qualifies table columns using aliases

DROP FUNCTION IF EXISTS public.create_wallet_transaction(integer, text, text, jsonb);
CREATE OR REPLACE FUNCTION public.create_wallet_transaction(
  p_amount integer,
  p_type text,
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  ret_tx_id bigint,
  ret_user_id uuid,
  ret_amount integer,
  ret_type text,
  ret_idempotency_key text,
  ret_metadata jsonb,
  ret_created_at timestamptz,
  ret_new_balance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  uid uuid := auth.uid();
  current_balance integer;
  inserted_id bigint;
  existing_tx record;
  computed_new_balance integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'privilege_not_granted';
  END IF;

  -- Idempotency: return existing tx if present
  IF p_idempotency_key IS NOT NULL THEN
    SELECT wt.id, wt.user_id, wt.amount, wt.type, wt.idempotency_key, wt.metadata, wt.created_at
      INTO existing_tx
    FROM public.wallet_transactions wt
    WHERE wt.user_id = uid AND wt.idempotency_key = p_idempotency_key
    LIMIT 1;

    IF existing_tx.id IS NOT NULL THEN
      SELECT COALESCE(w.balance, 0) INTO current_balance FROM public.wallets w WHERE w.user_id = uid;
      RETURN QUERY
        SELECT existing_tx.id AS ret_tx_id,
               existing_tx.user_id AS ret_user_id,
               existing_tx.amount AS ret_amount,
               existing_tx.type AS ret_type,
               existing_tx.idempotency_key AS ret_idempotency_key,
               existing_tx.metadata AS ret_metadata,
               existing_tx.created_at AS ret_created_at,
               COALESCE(current_balance, 0) AS ret_new_balance;
      RETURN;
    END IF;
  END IF;

  -- Ensure wallet row exists and lock it
  LOOP
    SELECT w.balance INTO current_balance FROM public.wallets w WHERE w.user_id = uid FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO public.wallets (user_id, balance, created_at, updated_at)
      VALUES (uid, 0, now(), now())
      ON CONFLICT DO NOTHING;
      CONTINUE;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  IF current_balance IS NULL THEN
    current_balance := 0;
  END IF;

  computed_new_balance := current_balance + p_amount;

  IF computed_new_balance < 0 THEN
    RAISE EXCEPTION 'balance_too_low' USING ERRCODE = 'check_violation';
  END IF;
  IF computed_new_balance > 1000 THEN
    RAISE EXCEPTION 'balance_exceeds_max' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.wallet_transactions (user_id, amount, type, idempotency_key, metadata, created_at)
  VALUES (uid, p_amount, p_type, p_idempotency_key, p_metadata, now())
  RETURNING id INTO inserted_id;

  UPDATE public.wallets
  SET balance = computed_new_balance, updated_at = now()
  WHERE user_id = uid;

  RETURN QUERY
    SELECT t.id AS ret_tx_id,
           t.user_id AS ret_user_id,
           t.amount AS ret_amount,
           t.type AS ret_type,
           t.idempotency_key AS ret_idempotency_key,
           t.metadata AS ret_metadata,
           t.created_at AS ret_created_at,
           w.balance AS ret_new_balance
    FROM public.wallet_transactions t
    JOIN public.wallets w ON w.user_id = uid
    WHERE t.id = inserted_id;

END;
$func$;

GRANT EXECUTE ON FUNCTION public.create_wallet_transaction(integer, text, text, jsonb) TO authenticated;
