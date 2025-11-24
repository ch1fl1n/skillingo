import { supabase } from '@/lib/supabase'

/**
 * 📊 TIPOS DE PROGRESO POR CATEGORÍA
 * Estructuras que rastrean el avance holístico del estudiante
 */

export type SkillCategory = 'Skills' | 'Character' | 'Meta-Learning'

/**
 * Resumen de progreso en UNA categoría específica
 * ¡Esto representa el crecimiento integral del estudiante!
 */
export interface CategoryProgressSummary {
  category: SkillCategory
  total_skills_in_category: number        // Cuántas habilidades hay en esta categoría
  completed_skills: number                // Cuántas ha dominado el estudiante
  average_progress_percent: number        // Progreso promedio (0-100)
  total_xp_earned_in_category: number     // XP ganado en esta categoría específica
  is_category_mastered: boolean           // ¿Ha completado todas las habilidades?
}

/**
 * Vista completa del progreso del estudiante across all categories
 * ¡La visión holística del crecimiento académico! 🌟
 */
export interface StudentProgressReport {
  user_id: string
  total_xp: number                        // XP total del estudiante
  current_level: number                   // Nivel de usuario (XP-based)
  learning_streak: number                 // Días consecutivos de aprendizaje
  category_summaries: CategoryProgressSummary[]
  overall_completion_percent: number      // Porcentaje general de completitud
  next_achievement_target?: string        // Próximo logro sugerido
}

/**
 * 🎯 FUNCIÓN: Obtener resumen de progreso por categoría
 * 
 * Calcula estadísticas exhaustivas de progreso para una categoría específica.
 * Respeta los principios de "transparencia" y "ética" en datos educativos.
 * 
 * @param userId - ID del usuario autenticado
 * @param category - Categoría a evaluar ('Skills', 'Character', 'Meta-Learning')
 * @returns CategoryProgressSummary con métricas detalladas
 */
export async function getCategoryProgressSummary(
  userId: string,
  category: SkillCategory
): Promise<CategoryProgressSummary> {
  // 🔍 Paso 1: Obtener todas las habilidades en esta categoría
  const { data: categorySkills, error: skillsError } = await supabase
    .from('skills')
    .select('id')
    .eq('category', category)

  if (skillsError) {
    throw new Error(`¡Error al obtener habilidades de ${category}! 🚨 ${skillsError.message}`)
  }

  const skillIds = categorySkills?.map(s => s.id) || []
  const total_skills_in_category = skillIds.length

  // 🎯 Paso 2: Obtener el progreso del usuario en estas habilidades
  const { data: userProgress, error: progressError } = await supabase
    .from('user_progress')
    .select('skill_id, progress_percent')
    .eq('user_id', userId)
    .in('skill_id', skillIds)

  if (progressError && !progressError.message.includes('No rows')) {
    throw new Error(`¡Error al obtener progreso! 📊 ${progressError.message}`)
  }

  const progressMap = new Map(
    userProgress?.map(p => [p.skill_id, p.progress_percent]) || []
  )

  // 📈 Paso 3: Calcular habilidades completadas (100% de progreso)
  const completed_skills = Array.from(progressMap.values()).filter(p => p >= 100).length
  
  // 💯 Paso 4: Calcular progreso promedio
  const progressValues = Array.from(progressMap.values())
  const average_progress_percent =
    progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0

  // ⭐ Paso 5: Contar XP ganado en lecciones de esta categoría
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, xp_reward')
    .in('skill_id', skillIds)

  if (lessonsError) {
    console.warn(`⚠️ Aviso al obtener lecciones: ${lessonsError.message}`)
  }

  const lessonIds = lessons?.map(l => l.id) || []
  const xpRewards = new Map(lessons?.map(l => [l.id, l.xp_reward]) || [])

  const { data: completedLessons } = await supabase
    .from('lesson_attempts')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', lessonIds)

  const total_xp_earned_in_category = (completedLessons || []).reduce(
    (sum, attempt) => sum + (xpRewards.get(attempt.lesson_id) || 0),
    0
  )

  return {
    category,
    total_skills_in_category,
    completed_skills,
    average_progress_percent,
    total_xp_earned_in_category,
    is_category_mastered: completed_skills === total_skills_in_category && total_skills_in_category > 0,
  }
}

/**
 * 📋 FUNCIÓN: Generar reporte completo de progreso del estudiante
 * 
 * ¡Esta es la "brecha de participación" resuelta! 🌉
 * Proporciona una visión transparente y ética del progreso del estudiante
 * a través de TODAS las dimensiones de aprendizaje del siglo XXI.
 * 
 * @param userId - ID del usuario
 * @returns StudentProgressReport completo con análisis por categoría
 */
export async function generateStudentProgressReport(
  userId: string
): Promise<StudentProgressReport> {
  // 👤 Paso 1: Obtener perfil del usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, total_xp, level')
    .eq('id', userId)
    .single()

  if (userError) {
    throw new Error(`❌ No se puede obtener perfil del usuario: ${userError.message}`)
  }

  // 🔥 Paso 2: Calcular racha de aprendizaje
  const { data: recentAttempts } = await supabase
    .from('lesson_attempts')
    .select('attempted_at')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(100)

  const learning_streak = calculateLearningStreak(recentAttempts || [])

  // 🎓 Paso 3: Obtener resumen de progreso para CADA categoría
  const categories: SkillCategory[] = ['Skills', 'Character', 'Meta-Learning']
  const category_summaries: CategoryProgressSummary[] = []

  for (const category of categories) {
    const summary = await getCategoryProgressSummary(userId, category)
    category_summaries.push(summary)
  }

  // 💯 Paso 4: Calcular completitud general
  const totalSkillsInAllCategories = category_summaries.reduce(
    (sum, cat) => sum + cat.total_skills_in_category,
    0
  )
  const totalCompletedSkills = category_summaries.reduce(
    (sum, cat) => sum + cat.completed_skills,
    0
  )
  const overall_completion_percent =
    totalSkillsInAllCategories > 0
      ? Math.round((totalCompletedSkills / totalSkillsInAllCategories) * 100)
      : 0

  // 🎯 Paso 5: Determinar próximo objetivo de logro
  const next_achievement_target = determineNextAchievementTarget(category_summaries)

  return {
    user_id: userId,
    total_xp: user?.total_xp || 0,
    current_level: user?.level || 1,
    learning_streak,
    category_summaries,
    overall_completion_percent,
    next_achievement_target,
  }
}

/**
 * 🔥 FUNCIÓN AUXILIAR: Calcular racha de aprendizaje consecutivo
 * 
 * Este es el "entusiasmo por aprender" medido! 🎉
 * Cuenta días consecutivos con al menos una lección completada.
 * 
 * @param attempts - Array de intentos de lección con timestamps
 * @returns Número de días consecutivos de aprendizaje
 */
export function calculateLearningStreak(
  attempts: Array<{ attempted_at: string | null }>
): number {
  if (attempts.length === 0) return 0

  // 📅 Convertir a fechas únicas (sin hora)
  const attemptDates = attempts
    .filter(a => a.attempted_at)
    .map(a => {
      const date = new Date(a.attempted_at!)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })

  // 🧹 Eliminar duplicados y ordenar descendente
  const uniqueDates = Array.from(new Set(attemptDates)).sort((a, b) => b - a)

  if (uniqueDates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()
  const oneDayMs = 24 * 60 * 60 * 1000

  // ⏸️ Si el último intento fue hace más de 1 día, la racha se rompe
  if (uniqueDates[0] < todayTime - oneDayMs) {
    return 0
  }

  // 🔗 Contar días consecutivos hacia atrás
  let streak = 0
  let expectedDate = todayTime

  for (const attemptDate of uniqueDates) {
    if (attemptDate === expectedDate || attemptDate === expectedDate - oneDayMs) {
      streak++
      expectedDate = attemptDate - oneDayMs
    } else {
      break
    }
  }

  return streak
}

/**
 * 🎯 FUNCIÓN AUXILIAR: Determinar próximo logro sugerido
 * 
 * ¡Gamificación inteligente! 🏆
 * Analiza dónde está el estudiante y sugiere el siguiente desafío apropiado.
 * Respeta el principio de "aplicación del aprendizaje" - práctica relevante!
 * 
 * @param summaries - Resúmenes de progreso por categoría
 * @returns Nombre del próximo logro recomendado
 */
export function determineNextAchievementTarget(
  summaries: CategoryProgressSummary[]
): string {
  // 🔍 Encontrar categoría con menor progreso
  const categoriesWithProgress = summaries
    .filter(s => s.total_skills_in_category > 0)
    .sort((a, b) => a.average_progress_percent - b.average_progress_percent)

  if (categoriesWithProgress.length === 0) {
    return 'Comienza tu primer viaje de aprendizaje! 🚀'
  }

  const lowestCategory = categoriesWithProgress[0]

  // ¡Sugerencias motivadoras basadas en la categoría!
  const suggestions: Record<SkillCategory, string> = {
    Skills:
      '¡Desbloquea todas las habilidades del siglo XXI! Necesitas ' +
      (lowestCategory.total_skills_in_category - lowestCategory.completed_skills) +
      ' más habilidades en ' +
      lowestCategory.category +
      ' 💪',
    Character:
      '¡Desarrolla tu carácter! Completa ' +
      (lowestCategory.total_skills_in_category - lowestCategory.completed_skills) +
      ' virtudes en ' +
      lowestCategory.category +
      ' ✨',
    'Meta-Learning':
      '¡Domina tu propio aprendizaje! Avanza en ' +
      lowestCategory.category +
      ' para la autoconciencia total 🧠',
  }

  return suggestions[lowestCategory.category]
}

/**
 * 📊 FUNCIÓN: Obtener comparativa de categorías
 * 
 * ¡Visualiza tu progreso holístico! 📈
 * Compara tu desempeño a través de todas las dimensiones educativas.
 * 
 * @param userId - ID del usuario
 * @returns Array de categorías ordenadas por progreso
 */
export async function getCategoryAchievementComparison(
  userId: string
): Promise<Array<CategoryProgressSummary & { rank: number }>> {
  const categories: SkillCategory[] = ['Skills', 'Character', 'Meta-Learning']
  const summaries: CategoryProgressSummary[] = []

  for (const category of categories) {
    const summary = await getCategoryProgressSummary(userId, category)
    summaries.push(summary)
  }

  // 📊 Ordenar por progreso (de mayor a menor)
  return summaries
    .sort((a, b) => b.average_progress_percent - a.average_progress_percent)
    .map((summary, index) => ({
      ...summary,
      rank: index + 1,
    }))
}
