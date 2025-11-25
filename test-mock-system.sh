#!/bin/bash

echo "=== Sistema Mock Expandido - Verificación ==="
echo ""

# Verificar archivos
echo "📋 Verificando archivos..."
files=(
    "lib/mock-database.ts"
    "lib/mock-evaluations.ts"
    "lib/mock-evaluations-expanded.ts"
    "lib/mastery-evaluator.ts"
    "app/skills/Creativity.tsx"
    "app/skills/CriticalThinking.tsx"
    "app/skills/Communication.tsx"
    "app/skills/Collaboration.tsx"
    "app/skills/Curiosity.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file FALTA"
    fi
done

echo ""
echo "📊 Estadísticas del sistema mock:"
echo ""

# Contar lecciones
echo "  Archivo mock-database.ts:"
if grep -q "id: 50" lib/mock-database.ts 2>/dev/null; then
    echo "    ✅ Contiene lección 50 (Imagination)"
    echo "    ✅ Total: 50 lecciones"
else
    echo "    ❌ No contiene lección 50"
fi

# Contar skills
echo ""
echo "  Skills implementadas:"
for i in {1..10}; do
    skill_count=$(grep -c "skill_id: $i" lib/mock-database.ts 2>/dev/null || echo 0)
    if [ $skill_count -gt 0 ]; then
        echo "    ✅ Skill $i: $skill_count lecciones"
    fi
done

echo ""
echo "🔧 Funciones de mock disponibles:"

# Verificar funciones en mock-evaluations-expanded
echo ""
echo "  mock-evaluations-expanded.ts:"
functions=(
    "createMockEvaluation"
    "getMockEvaluationForLesson"
    "getMockEvaluationExpanded"
    "generateAllMockEvaluations"
)

for func in "${functions[@]}"; do
    if grep -q "export function $func" lib/mock-evaluations-expanded.ts 2>/dev/null; then
        echo "    ✅ $func"
    else
        echo "    ❌ $func NO ENCONTRADA"
    fi
done

echo ""
echo "  mock-database.ts:"
db_functions=(
    "getAllMockLessons"
    "getMockLessonById"
    "getMockLessonsBySkillId"
    "getTotalMockLessons"
)

for func in "${db_functions[@]}"; do
    if grep -q "export function $func" lib/mock-database.ts 2>/dev/null; then
        echo "    ✅ $func"
    else
        echo "    ❌ $func NO ENCONTRADA"
    fi
done

echo ""
echo "🎯 Verificación de integración:"

if grep -q "getMockEvaluationExpanded" lib/mastery-evaluator.ts; then
    echo "  ✅ mastery-evaluator.ts importa versión expandida"
else
    echo "  ❌ mastery-evaluator.ts NO importa versión expandida"
fi

if grep -q "evaluateWithMastery" app/skills/Creativity.tsx; then
    echo "  ✅ Creativity.tsx usa evaluateWithMastery"
else
    echo "  ❌ Creativity.tsx NO usa evaluateWithMastery"
fi

echo ""
echo "✨ Verificación completada!"
echo ""
echo "Para testear:"
echo "  1. npm run web (o ios/android)"
echo "  2. Navega a cualquier habilidad"
echo "  3. Escribe una respuesta"
echo "  4. Presiona Submit"
echo "  5. Verás evaluación mock automáticamente"
