// constants/skills.ts

/**
 * Represents the different categories of skills available in the app.
 */
export type SkillCategory = 'Skills' | 'Character' | 'Meta-Learning';

import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
/**
 * Defines the structure for a single skill or lesson.
 */
export interface Skill {
  id: string;
  title: string;
  category: SkillCategory;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  isLocked: boolean;
}

/**
 * An array of all available skills, categorized and styled.
 * This data is used to populate the learning path on the main screen.
 */
export const skills: Skill[] = [
  // Category: Skills
  {
    id: 'creativity',
    title: 'Creativity',
    category: 'Skills',
    icon: 'lightbulb-on-outline',
    color: '#2ecc71', // Green
    isLocked: false,
  },
  {
    id: 'critical-thinking',
    title: 'Critical Thinking',
    category: 'Skills',
    icon: 'brain',
    color: '#3498db', // Blue
    isLocked: false,
  },
  {
    id: 'communication',
    title: 'Communication',
    category: 'Skills',
    icon: 'chat-processing-outline',
    color: '#9b59b6', // Purple
    isLocked: true,
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    category: 'Skills',
    icon: 'account-group-outline',
    color: '#f1c40f', // Yellow
    isLocked: true,
  },
  // Category: Character
  {
    id: 'curiosity',
    title: 'Curiosity',
    category: 'Character',
    icon: 'magnify',
    color: '#e67e22', // Orange
    isLocked: true,
  },
  {
    id: 'courage',
    title: 'Courage',
    category: 'Character',
    icon: 'shield-check-outline',
    color: '#e74c3c', // Red
    isLocked: true,
  },
  {
    id: 'resilience',
    title: 'Resilience',
    category: 'Character',
    icon: 'flower-tulip-outline',
    color: '#1abc9c', // Turquoise
    isLocked: true,
  },
  {
    id: 'ethics',
    title: 'Ethics',
    category: 'Character',
    icon: 'scale-balance',
    color: '#34495e', // Dark Blue
    isLocked: true,
  },
  // Category: Meta-Learning
  {
    id: 'metacognition',
    title: 'Metacognition',
    category: 'Meta-Learning',
    icon: 'head-cog-outline',
    color: '#27ae60', // Darker Green
    isLocked: true,
  },
  {
    id: 'metaemotion',
    title: 'Metaemotion',
    category: 'Meta-Learning',
    icon: 'emoticon-happy-outline',
    color: '#8e44ad', // Darker Purple
    isLocked: true,
  },
];
