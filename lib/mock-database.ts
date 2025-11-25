/**
 * Mock Database - Todas las 50 lecciones
 * Simulación de la tabla 'lessons' de Supabase
 */

export interface MockLesson {
  id: number;
  skill_id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  content: {
    question: string;
  };
  created_at: string;
}

const MOCK_LESSONS: MockLesson[] = [
  // CREATIVITY (skill_id: 1) - Lecciones 1-5
  {
    id: 1,
    skill_id: 1,
    title: 'Creativity Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Generate a unique idea for solving a daily problem.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 2,
    skill_id: 1,
    title: 'Creativity Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Reimagine a common object with a new purpose.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 3,
    skill_id: 1,
    title: 'Creativity Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Develop a creative solution to a complex constraint.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 4,
    skill_id: 1,
    title: 'Creativity Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Combine two unrelated concepts into something useful.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 5,
    skill_id: 1,
    title: 'Creativity Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'List five alternative uses for a familiar object.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // CRITICAL THINKING (skill_id: 2) - Lecciones 6-10
  {
    id: 6,
    skill_id: 2,
    title: 'Critical Thinking Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Identify assumptions in a simple argument.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 7,
    skill_id: 2,
    title: 'Critical Thinking Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Evaluate the strength of evidence in a claim.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 8,
    skill_id: 2,
    title: 'Critical Thinking Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Break down a complex argument into logical components.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 9,
    skill_id: 2,
    title: 'Critical Thinking Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Find flaws in a reasoning process.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 10,
    skill_id: 2,
    title: 'Critical Thinking Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Classify statements as fact or opinion.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // COMMUNICATION (skill_id: 3) - Lecciones 11-15
  {
    id: 11,
    skill_id: 3,
    title: 'Communication Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Rewrite a confusing sentence to improve clarity.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 12,
    skill_id: 3,
    title: 'Communication Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Summarize a paragraph in one concise sentence.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 13,
    skill_id: 3,
    title: 'Communication Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Transform a technical explanation for a non-expert audience.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 14,
    skill_id: 3,
    title: 'Communication Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Adapt a message for a different communication medium.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 15,
    skill_id: 3,
    title: 'Communication Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Identify the main point in a short text.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // COLLABORATION (skill_id: 4) - Lecciones 16-20
  {
    id: 16,
    skill_id: 4,
    title: 'Collaboration Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Describe the role of each team member in a scenario.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 17,
    skill_id: 4,
    title: 'Collaboration Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Resolve a disagreement between two teammates.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 18,
    skill_id: 4,
    title: 'Collaboration Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Design a workflow for a group project with constraints.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 19,
    skill_id: 4,
    title: 'Collaboration Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Improve a team communication breakdown.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 20,
    skill_id: 4,
    title: 'Collaboration Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Identify strengths teammates bring to a project.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // CURIOSITY (skill_id: 5) - Lecciones 21-25
  {
    id: 21,
    skill_id: 5,
    title: 'Curiosity Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Generate five questions about an unfamiliar topic.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 22,
    skill_id: 5,
    title: 'Curiosity Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Explore possible explanations for a strange observation.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 23,
    skill_id: 5,
    title: 'Curiosity Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Formulate a research approach to investigate a complex question.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 24,
    skill_id: 5,
    title: 'Curiosity Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Evaluate multiple hypotheses for the same problem.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 25,
    skill_id: 5,
    title: 'Curiosity Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Ask clarifying questions about a vague statement.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // COURAGE (skill_id: 6) - Lecciones 26-30
  {
    id: 26,
    skill_id: 6,
    title: 'Courage Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Describe a small risk you could take today.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 27,
    skill_id: 6,
    title: 'Courage Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Explain how you would handle a difficult conversation.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 28,
    skill_id: 6,
    title: 'Courage Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Plan a strategy to face a high-pressure challenge.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 29,
    skill_id: 6,
    title: 'Courage Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Identify obstacles that prevent taking action.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 30,
    skill_id: 6,
    title: 'Courage Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Reflect on a moment when you acted bravely.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // RESILIENCE (skill_id: 7) - Lecciones 31-35
  {
    id: 31,
    skill_id: 7,
    title: 'Resilience Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Describe a time you bounced back from a setback.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 32,
    skill_id: 7,
    title: 'Resilience Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Explain techniques for staying calm under stress.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 33,
    skill_id: 7,
    title: 'Resilience Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Create a recovery plan for a major personal challenge.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 34,
    skill_id: 7,
    title: 'Resilience Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Identify patterns in how you respond to adversity.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 35,
    skill_id: 7,
    title: 'Resilience Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'List strategies that help you keep going.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // ETHICS (skill_id: 8) - Lecciones 36-40
  {
    id: 36,
    skill_id: 8,
    title: 'Ethics Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Identify right and wrong in a simple moral scenario.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 37,
    skill_id: 8,
    title: 'Ethics Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Analyze a situation with conflicting moral principles.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 38,
    skill_id: 8,
    title: 'Ethics Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Resolve an ethical dilemma with multiple stakeholders.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 39,
    skill_id: 8,
    title: 'Ethics Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Evaluate the fairness of a decision.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 40,
    skill_id: 8,
    title: 'Ethics Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Recognize bias in a moral judgment.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // METACOGNITION (skill_id: 9) - Lecciones 41-45
  {
    id: 41,
    skill_id: 9,
    title: 'Metacognition Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Describe how you learn best.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 42,
    skill_id: 9,
    title: 'Metacognition Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Analyze your thought process while solving a problem.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 43,
    skill_id: 9,
    title: 'Metacognition Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Develop a plan to monitor and evaluate your thinking.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 44,
    skill_id: 9,
    title: 'Metacognition Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Identify thinking patterns that help or hurt you.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 45,
    skill_id: 9,
    title: 'Metacognition Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Reflect on how your approach to tasks changes over time.' },
    created_at: '2025-11-25 16:28:05.623953'
  },

  // IMAGINATION (skill_id: 10) - Lecciones 46-50
  {
    id: 46,
    skill_id: 10,
    title: 'Imagination Lesson 1',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Visualize a fictional world and describe one feature.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 47,
    skill_id: 10,
    title: 'Imagination Lesson 2',
    difficulty: 'easy',
    xp_reward: 20,
    content: { question: 'Invent a creature with unique abilities and explain them.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 48,
    skill_id: 10,
    title: 'Imagination Lesson 3',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Design a detailed scenario that challenges known rules.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 49,
    skill_id: 10,
    title: 'Imagination Lesson 4',
    difficulty: 'medium',
    xp_reward: 20,
    content: { question: 'Expand a simple idea into a vivid concept.' },
    created_at: '2025-11-25 16:28:05.623953'
  },
  {
    id: 50,
    skill_id: 10,
    title: 'Imagination Lesson 5',
    difficulty: 'hard',
    xp_reward: 20,
    content: { question: 'Imagine a simple invention that solves a small problem.' },
    created_at: '2025-11-25 16:28:05.623953'
  }
];

/**
 * Obtiene todas las lecciones mock
 */
export function getAllMockLessons(): MockLesson[] {
  return MOCK_LESSONS;
}

/**
 * Obtiene una lección específica
 */
export function getMockLessonById(id: number): MockLesson | undefined {
  return MOCK_LESSONS.find(lesson => lesson.id === id);
}

/**
 * Obtiene lecciones de una skill específica
 */
export function getMockLessonsBySkillId(skillId: number): MockLesson[] {
  return MOCK_LESSONS.filter(lesson => lesson.skill_id === skillId);
}

/**
 * Cuenta total de lecciones
 */
export function getTotalMockLessons(): number {
  return MOCK_LESSONS.length;
}
