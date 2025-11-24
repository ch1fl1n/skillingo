// SKILL CATEGORY PROGRESS COMPONENT

import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { Text } from '@/components/Themed'
import Colors from '@/constants/Colors'
import { useColorScheme } from '@/components/useColorScheme'
import {
  CategoryProgressSummary,
  StudentProgressReport,
  generateStudentProgressReport,
} from '@/lib/category-progress'

/**
 * 🎯 PROPS para el componente principal
 */
interface SkillCategoryProgressProps {
  userId: string
  onLoadComplete?: (report: StudentProgressReport) => void
}

/**
 * 📊 Props para la tarjeta de categoría individual
 */
interface CategoryCardProps {
  summary: CategoryProgressSummary & { rank?: number }
  colorScheme: 'light' | 'dark'
}

/**
 * 🌟 COMPONENTE PRINCIPAL: Mostrar progreso holístico del estudiante
 * 
 * Este componente es el "dashboard" educativo que implementa:
 *   🎓 Transparencia en datos (MIT Challenge #1)
 *   🌉 Equidad de acceso (Bridging the Participation Gap)
 *   💪 Motivación mediante visualización
 */
export const SkillCategoryProgress: React.FC<SkillCategoryProgressProps> = ({
  userId,
  onLoadComplete,
}) => {
  const colorScheme = useColorScheme()
  const [report, setReport] = useState<StudentProgressReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔄 Cargar datos del estudiante al montar
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true)
        setError(null)

        // 📡 Obtener reporte completo de progreso
        const studentReport = await generateStudentProgressReport(userId)
        setReport(studentReport)

        // ✅ Notificar componente padre si es necesario
        onLoadComplete?.(studentReport)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
        console.error('❌ Error cargando progreso:', errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [userId])

  // ⏳ Estado de carga
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme].tint}
        />
        <Text style={styles.loadingText}>¡Cargando tu progreso... 📊</Text>
      </View>
    )
  }

  // ❌ Estado de error
  if (error || !report) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error || 'No hay datos disponibles'}</Text>
      </View>
    )
  }

  // 🎉 Contenido principal
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 🏆 BANNER PRINCIPAL DE PROGRESO */}
      <View style={styles.bannerContainer}>
        <Text style={styles.bannerTitle}>¡Tu Viaje de Aprendizaje! 🚀</Text>
        
        {/* 💾 Información de XP y nivel */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>XP Total</Text>
            <Text style={styles.statValue}>{report.total_xp.toLocaleString()}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Nivel</Text>
            <Text style={styles.statValue}>{report.current_level}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Racha 🔥</Text>
            <Text style={styles.statValue}>{report.learning_streak} días</Text>
          </View>
        </View>

        {/* 📈 Barra de progreso general */}
        <View style={styles.overallProgressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Completitud General</Text>
            <Text style={styles.progressPercent}>{report.overall_completion_percent}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${report.overall_completion_percent}%`,
                  backgroundColor: getProgressColor(report.overall_completion_percent),
                },
              ]}
            />
          </View>
        </View>

        {/* 🎯 Siguiente objetivo sugerido */}
        {report.next_achievement_target && (
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>🎯 Próximo Objetivo:</Text>
            <Text style={styles.targetText}>{report.next_achievement_target}</Text>
          </View>
        )}
      </View>

      {/* 📚 SECCIÓN: Tarjetas de categorías */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Tu Crecimiento por Categoría 📊</Text>
        
        {report.category_summaries.map((summary, index) => (
          <CategoryProgressCard
            key={summary.category}
            summary={{ ...summary, rank: index + 1 }}
            colorScheme={colorScheme}
          />
        ))}
      </View>

      {/* 💡 SECCIÓN: Consejos educativos */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Insights Educativos 💡</Text>
        <EducationalInsights report={report} />
      </View>
    </ScrollView>
  )
}

/**
 * 🎨 COMPONENTE: Tarjeta individual de categoría
 * 
 * Visualiza el progreso en UNA categoría específica con:
 *   ✨ Código de colores según rendimiento
 *   📊 Estadísticas detalladas
 *   🏆 Indicador de maestría
 */
const CategoryProgressCard: React.FC<CategoryCardProps> = ({
  summary,
  colorScheme,
}) => {
  const getBackgroundColor = () => {
    if (summary.is_category_mastered) return Colors[colorScheme].success
    if (summary.average_progress_percent >= 75) return '#3498db' // Azul - Muy bien
    if (summary.average_progress_percent >= 50) return '#f39c12' // Naranja - Bien
    return '#e74c3c' // Rojo - Necesita trabajo
  }

  const getCategoryEmoji = () => {
    switch (summary.category) {
      case 'Skills':
        return '💪'
      case 'Character':
        return '✨'
      case 'Meta-Learning':
        return '🧠'
      default:
        return '📚'
    }
  }

  const getCategoryDescription = () => {
    switch (summary.category) {
      case 'Skills':
        return 'Pensamiento crítico, creatividad, comunicación, colaboración'
      case 'Character':
        return 'Virtudes: curiosidad, coraje, resiliencia, ética'
      case 'Meta-Learning':
        return 'Autoconciencia: metacognición y control emocional'
      default:
        return ''
    }
  }

  return (
    <View style={styles.categoryCard}>
      {/* Encabezado de categoría */}
      <View style={[styles.categoryHeader, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryEmoji}>{getCategoryEmoji()}</Text>
          <View>
            <Text style={styles.categoryName}>{summary.category}</Text>
            <Text style={styles.categoryRank}>Ranking: #{summary.rank}</Text>
          </View>
        </View>
        {summary.is_category_mastered && (
          <Text style={styles.masteredBadge}>🏆 MAESTRÍA</Text>
        )}
      </View>

      {/* Descripción */}
      <Text style={styles.categoryDescription}>{getCategoryDescription()}</Text>

      {/* Estadísticas en grid */}
      <View style={styles.statsGrid}>
        <StatBox
          label="Habilidades"
          value={`${summary.completed_skills}/${summary.total_skills_in_category}`}
          icon="✓"
        />
        <StatBox
          label="Progreso Promedio"
          value={`${summary.average_progress_percent}%`}
          icon="📊"
        />
        <StatBox
          label="XP Ganado"
          value={summary.total_xp_earned_in_category.toString()}
          icon="⭐"
        />
      </View>

      {/* Barra de progreso visual */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${summary.average_progress_percent}%`,
                backgroundColor: getBackgroundColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.progressPercentText}>{summary.average_progress_percent}%</Text>
      </View>

      {/* Mensaje motivador */}
      <Text style={styles.motivationalText}>
        {summary.is_category_mastered
          ? '🎉 ¡Has dominado esta categoría!'
          : `Continúa con ${summary.total_skills_in_category - summary.completed_skills} habilidades restantes`}
      </Text>
    </View>
  )
}

/**
 * 📊 COMPONENTE: Caja de estadística individual
 * Muestra una métrica clave con formato destacado
 */
interface StatBoxProps {
  label: string
  value: string
  icon: string
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, icon }) => (
  <View style={styles.statBox}>
    <Text style={styles.statBoxIcon}>{icon}</Text>
    <Text style={styles.statBoxLabel}>{label}</Text>
    <Text style={styles.statBoxValue}>{value}</Text>
  </View>
)

/**
 * 💡 COMPONENTE: Insights educativos personalizados
 * 
 * Proporciona recomendaciones basadas en el progreso del estudiante,
 * alineadas con principios pedagógicos del siglo XXI:
 *   ✅ Retroalimentación constructiva
 *   ✅ Orientación personalizada
 *   ✅ Motivación a través de datos
 */
const EducationalInsights: React.FC<{ report: StudentProgressReport }> = ({
  report,
}) => {
  const generateInsights = () => {
    const insights: string[] = []

    // 🔥 Racha de aprendizaje
    if (report.learning_streak >= 7) {
      insights.push('🔥 ¡Racha espectacular! Mantén este ritmo 7+ días seguidos')
    } else if (report.learning_streak >= 3) {
      insights.push('📈 ¡Vas muy bien! Alcanza 7 días de racha consecutiva')
    } else if (report.learning_streak === 0) {
      insights.push('⏰ Retoma hoy mismo tu aprendizaje para comenzar una racha')
    }

    // 📊 Categoría más fuerte
    const strongestCategory = report.category_summaries.reduce((prev, current) =>
      prev.average_progress_percent > current.average_progress_percent ? prev : current
    )

    if (strongestCategory.average_progress_percent >= 75) {
      insights.push(`💪 Excelente desempeño en ${strongestCategory.category}!`)
    }

    // 📚 Categoría que necesita trabajo
    const weakestCategory = report.category_summaries.reduce((prev, current) =>
      prev.average_progress_percent < current.average_progress_percent ? prev : current
    )

    if (weakestCategory.average_progress_percent < 50) {
      insights.push(`🎯 Enfócate en ${weakestCategory.category} para un crecimiento equilibrado`)
    }

    // 💯 Completitud general
    if (report.overall_completion_percent === 100) {
      insights.push('🏆 ¡Dominio total alcanzado! Eres un maestro del aprendizaje')
    } else if (report.overall_completion_percent >= 75) {
      insights.push('🚀 ¡Casi ahí! Falta poco para la maestría completa')
    }

    return insights.length > 0
      ? insights
      : ['📖 ¡Comienza tu viaje de aprendizaje hoy!']
  }

  return (
    <View style={styles.insightsContainer}>
      {generateInsights().map((insight, index) => (
        <View key={index} style={styles.insightItem}>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  )
}

/**
 * 🎨 FUNCIÓN AUXILIAR: Obtener color según progreso
 * 
 * Gamificación visual: Verde=Excelente, Naranja=Bien, Rojo=Necesita trabajo
 */
function getProgressColor(percent: number): string {
  if (percent >= 80) return '#27ae60' // Verde brillante
  if (percent >= 60) return '#3498db' // Azul
  if (percent >= 40) return '#f39c12' // Naranja
  return '#e74c3c' // Rojo
}

/**
 * 🎨 ESTILOS DEL COMPONENTE
 * Diseño limpio, moderno y accesible
 */
const styles = StyleSheet.create({
  // 📱 Contenedores generales
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // 🏆 Banner principal
  bannerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },

  // 📊 Fila de estadísticas
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },

  // 📈 Progreso general
  overallProgressContainer: {
    marginVertical: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },

  // 🎯 Objetivo siguiente
  targetContainer: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  targetLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  targetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },

  // 📚 Sección de categorías
  categoriesSection: {
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  categoryHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryRank: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  masteredBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },

  // 📊 Grid de estadísticas
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statBoxIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
    textAlign: 'center',
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },

  // 📈 Barra de progreso en tarjeta
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    minWidth: 45,
    textAlign: 'right',
  },

  // 💬 Mensaje motivador
  motivationalText: {
    fontSize: 12,
    color: '#27ae60',
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontWeight: '500',
  },

  // 💡 Sección de insights
  insightsSection: {
    marginTop: 12,
  },
  insightsContainer: {
    gap: 8,
  },
  insightItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  insightText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },

  // 📚 Sección general
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },

  // ⏳ Estado de carga
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // ❌ Estado de error
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
})

export default SkillCategoryProgress
