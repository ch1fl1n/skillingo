import { useMutation } from '@tanstack/react-query';
import { generateMasteryFeedback, MasteryInput, MasteryFeedback } from '@/lib/gemini';

// Hook para solicitar retroalimentación de dominio mediante Gemini
// Uso:
// const masteryMutation = useMasteryFeedback();
// masteryMutation.mutate({ objectives: [...], questions: [...], passingScore: 70 });
export function useMasteryFeedback() {
  return useMutation<MasteryFeedback, Error, MasteryInput>({
    mutationFn: async (input: MasteryInput) => {
      const feedback = await generateMasteryFeedback(input);
      return feedback;
    },
  });
}

export type { MasteryInput, MasteryFeedback };
