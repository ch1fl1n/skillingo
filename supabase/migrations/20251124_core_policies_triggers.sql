-- Migración adicional: funciones, políticas RLS faltantes y trigger de XP.

-- Función: XP por score/dificultad
CREATE OR REPLACE FUNCTION public.fn_xp_for_score(score numeric, difficulty text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE difficulty
    WHEN 'easy' THEN ROUND(10 * LEAST(1, score/100))
    WHEN 'medium' THEN ROUND(20 * LEAST(1, score/100))
    WHEN 'hard' THEN ROUND(30 * LEAST(1, score/100))
    ELSE ROUND(10 * LEAST(1, score/100))
  END;
$$;

-- Función: nivel desde XP total (simple)
CREATE OR REPLACE FUNCTION public.fn_level_from_total_xp(total_xp int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT FLOOR(1 + total_xp / 100);
$$;

-- Trigger: tras insertar/actualizar intento completado aplicar efectos.
CREATE OR REPLACE FUNCTION public.trg_after_lesson_attempts_upsert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_xp int;
  v_total_xp int;
  v_new_total int;
  v_level int;
  v_skill int;
BEGIN
  -- Sólo actuar si el intento está completado
  IF NEW.completed IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  -- Obtener skill (asumiendo lessons tiene skill_id)
  SELECT skill_id INTO v_skill FROM lessons WHERE id = NEW.lesson_id;

  -- Calcular XP del intento
  v_xp := fn_xp_for_score(NEW.score, (SELECT difficulty FROM lessons WHERE id = NEW.lesson_id));

  -- Actualizar progreso (set 100% si completado)
  INSERT INTO user_progress(user_id, skill_id, progress_percent, last_updated)
  VALUES (NEW.user_id, v_skill, 100, now())
  ON CONFLICT (user_id, skill_id) DO UPDATE SET progress_percent = 100, last_updated = now();

  -- Acumular XP
  SELECT total_xp INTO v_total_xp FROM users WHERE id = NEW.user_id;
  v_new_total := COALESCE(v_total_xp,0) + COALESCE(v_xp,0);
  v_level := fn_level_from_total_xp(v_new_total);
  UPDATE users SET total_xp = v_new_total, level = v_level WHERE id = NEW.user_id;

  -- Primer logro (first_lesson)
  IF NOT EXISTS (
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = NEW.user_id AND a.code = 'first_lesson'
  ) THEN
    INSERT INTO user_achievements(user_id, achievement_id, achieved_at)
    SELECT NEW.user_id, a.id, now() FROM achievements a WHERE a.code = 'first_lesson';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_lesson_attempts_upsert ON lesson_attempts;
CREATE TRIGGER trg_after_lesson_attempts_upsert
AFTER INSERT OR UPDATE ON lesson_attempts
FOR EACH ROW EXECUTE FUNCTION public.trg_after_lesson_attempts_upsert();
