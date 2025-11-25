// Mapping de objetivos de aprendizaje por skill_id
// Centraliza la definición para reutilizar en evaluación por dominio.

import type { LearningObjective } from '@/types/mastery-evaluation.types';

export const OBJECTIVES_BY_SKILL: Record<number, LearningObjective[]> = {
  1: [
    { id: 'creativity-originality', description: 'Generar ideas originales y únicas', weight: 0.4 },
    { id: 'creativity-practicality', description: 'Proponer soluciones prácticas aplicables', weight: 0.35 },
    { id: 'creativity-elaboration', description: 'Desarrollar la idea con suficiente detalle', weight: 0.25 },
  ],
  2: [
    { id: 'critical-analysis', description: 'Descomponer el argumento en partes lógicas', weight: 0.35 },
    { id: 'critical-evidence', description: 'Evaluar fuerza y relevancia de evidencia', weight: 0.35 },
    { id: 'critical-bias', description: 'Identificar posibles sesgos y supuestos', weight: 0.30 },
  ],
  3: [
    { id: 'communication-clarity', description: 'Comunicar con claridad y precisión', weight: 0.4 },
    { id: 'communication-structure', description: 'Organizar el mensaje de forma lógica', weight: 0.35 },
    { id: 'communication-audience', description: 'Adaptar el mensaje a la audiencia', weight: 0.25 },
  ],
  4: [
    { id: 'collaboration-roles', description: 'Reconocer y describir roles del equipo', weight: 0.35 },
    { id: 'collaboration-conflict', description: 'Proponer resolución constructiva de desacuerdos', weight: 0.35 },
    { id: 'collaboration-contribution', description: 'Aportar mejoras al proceso grupal', weight: 0.30 },
  ],
  5: [
    { id: 'curiosity-questioning', description: 'Formular preguntas relevantes y profundas', weight: 0.4 },
    { id: 'curiosity-exploration', description: 'Explorar múltiples hipótesis o explicaciones', weight: 0.35 },
    { id: 'curiosity-refinement', description: 'Refinar preguntas para mayor precisión', weight: 0.25 },
  ],
  6: [
    { id: 'courage-risk', description: 'Identificar y asumir riesgos calculados', weight: 0.35 },
    { id: 'courage-preparation', description: 'Planificar acciones ante desafío difícil', weight: 0.35 },
    { id: 'courage-reflection', description: 'Reflexionar sobre actos valientes previos', weight: 0.30 },
  ],
  7: [
    { id: 'resilience-recovery', description: 'Describir estrategias para recuperarse de reveses', weight: 0.35 },
    { id: 'resilience-stress', description: 'Aplicar técnicas de calma bajo presión', weight: 0.35 },
    { id: 'resilience-patterns', description: 'Identificar patrones personales ante adversidad', weight: 0.30 },
  ],
  8: [
    { id: 'ethics-principles', description: 'Reconocer principios morales en juego', weight: 0.35 },
    { id: 'ethics-fairness', description: 'Evaluar imparcialidad y justicia de decisiones', weight: 0.35 },
    { id: 'ethics-bias', description: 'Detectar posibles sesgos en juicios morales', weight: 0.30 },
  ],
  9: [
    { id: 'metacognition-awareness', description: 'Describir cómo aprende mejor', weight: 0.35 },
    { id: 'metacognition-monitor', description: 'Monitorear y ajustar pensamiento en proceso', weight: 0.35 },
    { id: 'metacognition-patterns', description: 'Identificar patrones útiles o perjudiciales', weight: 0.30 },
  ],
  10: [
    { id: 'imagination-world', description: 'Visualizar escenarios o mundos con detalle', weight: 0.35 },
    { id: 'imagination-creation', description: 'Inventar entidades o soluciones originales', weight: 0.35 },
    { id: 'imagination-expansion', description: 'Expandir ideas simples en conceptos vívidos', weight: 0.30 },
  ],
};

export function getObjectivesForSkill(skillId: number): LearningObjective[] {
  return OBJECTIVES_BY_SKILL[skillId] || [];
}
