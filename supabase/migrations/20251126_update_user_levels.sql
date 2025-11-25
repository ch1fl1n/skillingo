-- Update existing users.level to match new XP progression
-- New rule: total XP thresholds: L1=100, L2=225, L3=350, ...
-- level = floor((total_xp + 25) / 125)

BEGIN;

-- Safety: only update if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='total_xp') THEN
    UPDATE public.users
    SET level = GREATEST(0, ((COALESCE(total_xp, 0) + 25) / 125))::int;
  END IF;
END$$;

COMMIT;
