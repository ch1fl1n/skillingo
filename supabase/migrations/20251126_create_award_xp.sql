-- Create award_xp RPC: increments authenticated user's total_xp by p_xp and returns new totals
DROP FUNCTION IF EXISTS public.award_xp(integer);
CREATE OR REPLACE FUNCTION public.award_xp(p_xp integer)
RETURNS TABLE(new_total_xp integer, new_level integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  uid uuid := auth.uid();
  updated_total integer;
  computed_level integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'privilege_not_granted';
  END IF;

  UPDATE public.users
  SET total_xp = COALESCE(total_xp, 0) + p_xp,
      updated_at = now()
  WHERE id = uid
  RETURNING total_xp INTO updated_total;

  IF updated_total IS NULL THEN
    updated_total := p_xp;
  END IF;

  -- Compute level using same formula as client: floor((total_xp + 25) / 125)
  computed_level := ((updated_total + 25) / 125)::int;

  UPDATE public.users SET level = computed_level WHERE id = uid;

  RETURN QUERY SELECT updated_total, computed_level;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.award_xp(integer) TO authenticated;
