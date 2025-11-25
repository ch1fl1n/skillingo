/**
 * Mock Evaluations - Datos hardcodeados para testing
 * Cuando Gemini API falla o está exhausto, usa estas evaluaciones de ejemplo
 */

import type { MasteryEvaluation } from '@/types/mastery-evaluation.types';

export const mockEvaluations: Record<number, MasteryEvaluation> = {
  // Creativity - Idea Fusion
  1: {
    lessonId: 1,
    userId: 'mock-user',
    timestamp: new Date().toISOString(),
    overallMastery: 'achieved',
    overallScore: 85,
    objectives: [
      {
        objectiveId: 'obj-1',
        mastery: 'achieved',
        qualitativeAssessment: 'Tu idea demuestra gran originalidad. Combinar componentes comunes de formas inesperadas es el corazón de la creatividad.',
        quantitativeScore: 88,
        evidence: [
          'Propones una combinación novedosa',
          'Va más allá del ejemplo dado',
          'La solución es ingeniosa'
        ],
        suggestions: [
          'Considera cómo se vería el prototipo físicamente',
          'Piensa en mejoras iterativas de tu idea'
        ]
      },
      {
        objectiveId: 'obj-2',
        mastery: 'achieved',
        qualitativeAssessment: 'Tu invento resuelve un problema real o proporciona valor genuino, demostrando pensamiento práctico.',
        quantitativeScore: 84,
        evidence: [
          'La idea tiene aplicación real',
          'Resuelve un problema cotidiano',
          'Es económicamente viable'
        ],
        suggestions: [
          'Especifica exactamente quién se beneficiaría',
          'Calcula costos de producción'
        ]
      },
      {
        objectiveId: 'obj-3',
        mastery: 'achieved',
        qualitativeAssessment: 'Explicas claramente cómo funciona tu invento, facilitando que otros lo entiendan.',
        quantitativeScore: 82,
        evidence: [
          'Describes los componentes clave',
          'Explicas el proceso de uso',
          'Es fácil de seguir'
        ],
        suggestions: [
          'Añade detalles técnicos específicos',
          'Describe paso a paso la construcción'
        ]
      }
    ],
    conversationalFeedback: {
      opening: '¡Excelente respuesta! Tu idea muestra pensamiento creativo y práctico combinados.',
      strengths: [
        'Combinas componentes de formas innovadoras y sorprendentes',
        'Tu invento resuelve un problema real',
        'Explicas tu idea de forma clara y accesible'
      ],
      areasForGrowth: [
        'Profundiza en los detalles de cómo se construiría',
        'Considera limitaciones de materiales y coste'
      ],
      encouragement: '¡Vas muy bien! Continúa explorando combinaciones inesperadas. La creatividad se desarrolla con la práctica.',
      dialoguePrompts: [
        '¿Cómo construirías un prototipo de tu idea?',
        '¿Qué usuarios se beneficiarían más de tu invento?'
      ]
    },
    nextSteps: [
      'Dibuja un prototipo conceptual',
      'Busca otras 3 combinaciones de objetos cotidianos',
      'Presenta tu idea a alguien más y recoge feedback'
    ],
    resourcesSuggested: [
      'Técnicas de pensamiento divergente',
      'Casos de éxito: inventos de objetos reutilizados'
    ]
  },

  // Critical Thinking - Spot the Bias
  2: {
    lessonId: 2,
    userId: 'mock-user',
    timestamp: new Date().toISOString(),
    overallMastery: 'achieved',
    overallScore: 90,
    objectives: [
      {
        objectiveId: 'obj-1',
        mastery: 'achieved',
        qualitativeAssessment: 'Identificas múltiples sesgos con precisión y nombre específicos. Demuestras profundo entendimiento.',
        quantitativeScore: 92,
        evidence: [
          'Nombras sesgos específicos (confirmación, disponibilidad)',
          'Reconoces generalización excesiva',
          'Identificas palabras clave problemáticas'
        ],
        suggestions: [
          'Explora otros tipos de sesgos cognitivos',
          'Relaciona con falacias lógicas'
        ]
      },
      {
        objectiveId: 'obj-2',
        mastery: 'achieved',
        qualitativeAssessment: 'Respalda tu análisis con evidencia sólida y contraejemplos convincentes.',
        quantitativeScore: 88,
        evidence: [
          'Referencias a estudios científicos',
          'Proporcionas contraejemplos reales',
          'Tu lógica es rigurosa'
        ],
        suggestions: [
          'Cita estudios específicos',
          'Incluye datos cuantitativos cuando sea posible'
        ]
      },
      {
        objectiveId: 'obj-3',
        mastery: 'achieved',
        qualitativeAssessment: 'Reconoces la complejidad del tema y evitas sobresimplificación.',
        quantitativeScore: 90,
        evidence: [
          'Acknowledges que hay matices',
          'Consideras perspectivas diferentes',
          'No haces juicios categóricos'
        ],
        suggestions: []
      }
    ],
    conversationalFeedback: {
      opening: '¡Análisis excepcional! Demuestras pensamiento crítico sofisticado y profundo.',
      strengths: [
        'Identificas sesgos con exactitud científica',
        'Respaldes cada punto con evidencia concreta',
        'Entiendes los mecanismos psicológicos detrás del sesgo'
      ],
      areasForGrowth: [
        'Continúa practicando con afirmaciones más sutiles',
        'Estudia cómo reconocer sesgos implícitos'
      ],
      encouragement: '¡Sobresaliente! Este es exactamente el nivel de pensamiento crítico que necesitamos en el mundo.',
      dialoguePrompts: [
        '¿Cómo reconocerías sesgos en afirmaciones más sutiles?',
        '¿Reconoces algún sesgo en tus propias creencias?'
      ]
    },
    nextSteps: [
      'Analiza un artículo de noticias buscando sesgos',
      'Estudia falacias lógicas formales',
      'Crea afirmaciones sesgadas para que otros analicen'
    ],
    resourcesSuggested: [
      'Lista completa de sesgos cognitivos',
      'Recursos sobre pensamiento crítico avanzado'
    ]
  },

  // Communication - Clarify the Message
  3: {
    lessonId: 3,
    userId: 'mock-user',
    timestamp: new Date().toISOString(),
    overallMastery: 'achieved',
    overallScore: 87,
    objectives: [
      {
        objectiveId: 'obj-1',
        mastery: 'achieved',
        qualitativeAssessment: 'Tu reescritura es significativamente más clara y directa que el original.',
        quantitativeScore: 90,
        evidence: [
          'Eliminas palabras ambiguas y dudosas',
          'El mensaje es inequívoco',
          'No hay espacio para malinterpretación'
        ],
        suggestions: []
      },
      {
        objectiveId: 'obj-2',
        mastery: 'achieved',
        qualitativeAssessment: 'Reduces las palabras innecesarias mientras preservas el significado completo.',
        quantitativeScore: 84,
        evidence: [
          'Mantienes estructura clara pero concisa',
          'Cada palabra tiene propósito',
          'Fácil de leer y memorizar'
        ],
        suggestions: [
          'Aún podrías eliminar una o dos palabras más'
        ]
      },
      {
        objectiveId: 'obj-3',
        mastery: 'achieved',
        qualitativeAssessment: 'El tono es profesional y apropiado para el contexto laboral.',
        quantitativeScore: 87,
        evidence: [
          'Usa lenguaje formal pero accesible',
          'Mantiene respeto pero es asertivo',
          'Es apropiado para email o memo corporativo'
        ],
        suggestions: []
      }
    ],
    conversationalFeedback: {
      opening: '¡Excelente mejora! Tu reescritura es clara, concisa y profesional.',
      strengths: [
        'Eliminas toda ambigüedad del mensaje original',
        'Mantienes tono profesional y respetuoso',
        'La comunicación es directa y efectiva'
      ],
      areasForGrowth: [],
      encouragement: '¡Perfecto! Esta es exactamente la comunicación clara que se espera en ambientes profesionales.',
      dialoguePrompts: [
        '¿Dónde más podrías aplicar estas técnicas de comunicación clara?'
      ]
    },
    nextSteps: [
      'Revisa tus propios correos buscando ambigüedad',
      'Aplica esta técnica a reportes o documentos',
      'Enseña esta técnica a un colega'
    ],
    resourcesSuggested: [
      'Guía de comunicación clara para negocios'
    ]
  },

  // Collaboration - Team Roles
  4: {
    lessonId: 4,
    userId: 'mock-user',
    timestamp: new Date().toISOString(),
    overallMastery: 'achieved',
    overallScore: 86,
    objectives: [
      {
        objectiveId: 'obj-1',
        mastery: 'achieved',
        qualitativeAssessment: 'Asignas roles que se alinean bien con las fortalezas típicas de cada tipo de persona.',
        quantitativeScore: 85,
        evidence: [
          'Las asignaciones son lógicas',
          'Consideras habilidades complementarias',
          'Reconoces diferentes tipos de contribución'
        ],
        suggestions: [
          'Profundiza en cómo identificar las fortalezas individuales',
          'Considera factores adicionales como intereses'
        ]
      },
      {
        objectiveId: 'obj-2',
        mastery: 'achieved',
        qualitativeAssessment: 'Justificas claramente por qué cada persona debería tener ese rol.',
        quantitativeScore: 87,
        evidence: [
          'Explains beneficios de cada asignación',
          'Tu lógica es fácil de seguir',
          'Consideras el valor que cada rol aporta'
        ],
        suggestions: []
      },
      {
        objectiveId: 'obj-3',
        mastery: 'achieved',
        qualitativeAssessment: 'Demuestras entender que la colaboración requiere complementariedad y balance.',
        quantitativeScore: 86,
        evidence: [
          'Reconoces interdependencias entre roles',
          'Consideras cómo se comunican',
          'Piensas en cómo trabajan juntos'
        ],
        suggestions: [
          'Amplía tu consideración de dinámicas de grupo'
        ]
      }
    ],
    conversationalFeedback: {
      opening: '¡Bien hecho! Tu análisis de roles es sólido y muestra buen entendimiento de la colaboración.',
      strengths: [
        'Asignas roles de forma lógica y justificada',
        'Reconoces la importancia del balance y complementariedad',
        'Tu pensamiento considera la dinámica del equipo'
      ],
      areasForGrowth: [
        'Considera cómo manejar conflictos entre roles',
        'Piensa en situaciones donde roles pueden cambiar'
      ],
      encouragement: '¡Excelente! Continuemos desarrollando tu capacidad de liderazgo y trabajo en equipo.',
      dialoguePrompts: [
        '¿Cómo rotarías los roles para que todos aprendan?',
        '¿Qué pasaría si falta uno de estos roles?'
      ]
    },
    nextSteps: [
      'Forma equipos reales y aplica este análisis',
      'Observa equipos exitosos e identifica sus roles',
      'Aprende sobre marcos de referencia de equipos'
    ],
    resourcesSuggested: [
      'Marcos de roles de equipos efectivos',
      'Casos de éxito en colaboración'
    ]
  },

  // Curiosity - Ask Better Questions
  5: {
    lessonId: 5,
    userId: 'mock-user',
    timestamp: new Date().toISOString(),
    overallMastery: 'achieved',
    overallScore: 88,
    objectives: [
      {
        objectiveId: 'obj-1',
        mastery: 'achieved',
        qualitativeAssessment: 'Tus preguntas son abiertas, provocativas y generan reflexión genuina.',
        quantitativeScore: 89,
        evidence: [
          'Las preguntas no tienen respuesta simple',
          'Invitan a múltiples perspectivas',
          'Son estimulantes intelectualmente'
        ],
        suggestions: []
      },
      {
        objectiveId: 'obj-2',
        mastery: 'achieved',
        qualitativeAssessment: 'Tus preguntas van más allá de la superficie, explorando causas raíz y consecuencias.',
        quantitativeScore: 87,
        evidence: [
          'Preguntas "por qué" múltiples veces',
          'Exploras causas profundas',
          'Consideras implicaciones',
          'Buscas comprensión fundamental'
        ],
        suggestions: [
          'Continúa profundizando aún más'
        ]
      },
      {
        objectiveId: 'obj-3',
        mastery: 'achieved',
        qualitativeAssessment: 'Se nota tu curiosidad genuina e interés en el tema. Es inspirador.',
        quantitativeScore: 88,
        evidence: [
          'Tus preguntas reflejan pasión real',
          'No son formularias ni forzadas',
          'Muestran pensamiento personal'
        ],
        suggestions: []
      }
    ],
    conversationalFeedback: {
      opening: '¡Tu curiosidad es admirable! Tus preguntas demuestran verdadero interés por aprender.',
      strengths: [
        'Formulas preguntas profundas y reflexivas',
        'Tu curiosidad es genuina y motivadora',
        'Buscas comprensión fundamental, no solo respuestas superficiales'
      ],
      areasForGrowth: [
        'Continúa cultivando esta curiosidad natural',
        'Busca conexiones entre diferentes áreas de conocimiento'
      ],
      encouragement: '¡Excelente! La curiosidad es el motor del aprendizaje. Mantén este espíritu de investigación.',
      dialoguePrompts: [
        '¿Cómo puedes compartir tu curiosidad con otros?',
        '¿Hacia dónde quieres dirigir tu investigación?'
      ]
    },
    nextSteps: [
      'Investiga las respuestas a tus propias preguntas',
      'Enseña a otros cómo hacer preguntas profundas',
      'Documenta tu viaje de descubrimiento'
    ],
    resourcesSuggested: [
      'Recursos sobre investigación autodidacta',
      'Comunidades de aprendizaje continuo'
    ]
  }
};

/**
 * Obtiene una evaluación mock para una lección
 */
export function getMockEvaluation(lessonId: number): MasteryEvaluation | null {
  return mockEvaluations[lessonId] || null;
}

/**
 * Retorna una evaluación "No lograda" genérica para cualquier lección
 */
export function getMockNotAchievedEvaluation(lessonId: number): MasteryEvaluation {
  return {
    lessonId,
    userId: 'mock-user',
    timestamp: new Date().toISOString(),
    overallMastery: 'not-achieved',
    overallScore: 45,
    objectives: [
      {
        objectiveId: 'obj-1',
        mastery: 'not-achieved',
        qualitativeAssessment: 'Tu respuesta es un buen primer intento, pero necesita más desarrollo.',
        quantitativeScore: 40,
        evidence: ['La respuesta es incompleta'],
        suggestions: [
          'Proporciona más detalles y ejemplos',
          'Profundiza en tu análisis'
        ]
      },
      {
        objectiveId: 'obj-2',
        mastery: 'not-achieved',
        qualitativeAssessment: 'Necesitas desarrollar este aspecto más.',
        quantitativeScore: 45,
        evidence: [],
        suggestions: [
          'Estudia ejemplos de respuestas completas',
          'Practica con ejercicios similares'
        ]
      },
      {
        objectiveId: 'obj-3',
        mastery: 'not-achieved',
        qualitativeAssessment: 'Hay espacio para mejora significativa aquí.',
        quantitativeScore: 50,
        evidence: [],
        suggestions: [
          'Revisa el concepto fundamental',
          'Intenta nuevamente después de estudiar'
        ]
      }
    ],
    conversationalFeedback: {
      opening: 'Gracias por tu intento. Vamos a trabajar en mejorar esta respuesta.',
      strengths: [
        'Hiciste un esfuerzo por responder',
        'Tu disposición a aprender es positiva'
      ],
      areasForGrowth: [
        'Necesitas más profundidad en tu análisis',
        'Agrega ejemplos concretos',
        'Estudia el concepto más cuidadosamente'
      ],
      encouragement: 'No te desanimes. Cada intento te acerca más al dominio. ¡Prueba de nuevo!',
      dialoguePrompts: [
        '¿Qué parte fue más difícil para ti?',
        '¿Qué recursos necesitas para mejorar?'
      ]
    },
    nextSteps: [
      'Revisa el material de la lección',
      'Estudia ejemplos de buenas respuestas',
      'Intenta el desafío nuevamente'
    ],
    resourcesSuggested: [
      'Resumen de conceptos clave',
      'Ejercicios de práctica adicionales'
    ]
  };
}
