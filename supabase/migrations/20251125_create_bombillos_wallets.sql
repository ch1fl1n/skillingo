-- Migration: Create bombillos wallet and transactions + RPC
-- Adds: public.wallets, public.wallet_transactions,
--      public.create_wallet_transaction(p_amount, p_type, p_idempotency_key, p_metadata)
-- Enforces balance bounds 0..1000 and idempotency per user

-- 1) wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0 AND balance <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique idempotency per user
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_user_id_idempotency_key_idx
  ON public.wallet_transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_created_at_idx
  ON public.wallet_transactions (user_id, created_at DESC);

-- 3) RPC: create_wallet_transaction
DROP FUNCTION IF EXISTS public.create_wallet_transaction(integer, text, text, jsonb);
CREATE OR REPLACE FUNCTION public.create_wallet_transaction(
  p_amount integer,
  p_type text,
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  tx_id bigint,
  user_id uuid,
  amount integer,
  type text,
  idempotency_key text,
  metadata jsonb,
  created_at timestamptz,
  new_balance integer
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
    SELECT id, user_id, amount, type, idempotency_key, metadata, created_at
      INTO existing_tx
    FROM public.wallet_transactions
    WHERE user_id = uid AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF existing_tx.id IS NOT NULL THEN
      SELECT COALESCE(balance, 0) INTO current_balance FROM public.wallets WHERE user_id = uid;
      RETURN QUERY
        SELECT existing_tx.id, existing_tx.user_id, existing_tx.amount, existing_tx.type,
               existing_tx.idempotency_key, existing_tx.metadata, existing_tx.created_at,
               COALESCE(current_balance, 0);
      RETURN;
    END IF;
  END IF;

  -- Ensure wallet row exists and lock it
  LOOP
    SELECT balance INTO current_balance FROM public.wallets WHERE user_id = uid FOR UPDATE;
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
    SELECT t.id, t.user_id, t.amount, t.type, t.idempotency_key, t.metadata, t.created_at, w.balance
    FROM public.wallet_transactions t
    JOIN public.wallets w ON w.user_id = uid
    WHERE t.id = inserted_id;

END;
$func$;

-- 4) RLS policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to select own wallet
DROP POLICY IF EXISTS wallets_select_owner ON public.wallets;
CREATE POLICY wallets_select_owner ON public.wallets
  FOR SELECT
  USING (user_id = auth.uid());

-- Disallow direct update/delete from clients
DROP POLICY IF EXISTS wallets_no_update ON public.wallets;
CREATE POLICY wallets_no_update ON public.wallets
  FOR UPDATE
  USING (false)
  WITH CHECK (false);
DROP POLICY IF EXISTS wallets_no_delete ON public.wallets;
CREATE POLICY wallets_no_delete ON public.wallets
  FOR DELETE
  USING (false);

-- Allow users to select their transactions
DROP POLICY IF EXISTS wallet_transactions_select_owner ON public.wallet_transactions;
CREATE POLICY wallet_transactions_select_owner ON public.wallet_transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Disallow direct INSERT by clients (force use of RPC)
DROP POLICY IF EXISTS wallet_transactions_no_insert ON public.wallet_transactions;
CREATE POLICY wallet_transactions_no_insert ON public.wallet_transactions
  FOR INSERT
  WITH CHECK (false);

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.create_wallet_transaction(integer, text, text, jsonb) TO authenticated;
