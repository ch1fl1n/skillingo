import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { safeGenerateStructured, JSONSchema } from '../../lib/gemini';

// Esquema de receta (similar al ejemplo oficial)
const recipeSchema: JSONSchema = {
  type: 'object',
  properties: {
    recipe_name: { type: 'string', description: 'Nombre de la receta.' },
    prep_time_minutes: { type: 'integer', description: 'Tiempo opcional de preparación en minutos.' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del ingrediente.' },
          quantity: { type: 'string', description: 'Cantidad con unidades.' }
        },
        required: ['name', 'quantity']
      }
    },
    instructions: { type: 'array', items: { type: 'string' } }
  },
  required: ['recipe_name', 'ingredients', 'instructions']
};

interface RecipeIngredient { name: string; quantity: string }
interface RecipeData {
  recipe_name: string;
  prep_time_minutes?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
}

export default function RecipeExtractor() {
  const [input, setInput] = useState('Texto libre de receta aquí...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecipeData | null>(null);

  async function extract() {
    setLoading(true); setError(null); setData(null);
    const result = await safeGenerateStructured<RecipeData>({ prompt: input, schema: recipeSchema });
    setLoading(false);
    if (!result.ok) { setError(result.error || 'Error'); return; }
    setData(result.data!);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Extractor de Recetas (Structured Output)</Text>
      <TextInput
        multiline
        value={input}
        onChangeText={setInput}
        style={{ minHeight: 160, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 }}
      />
      <Button title={loading ? 'Procesando...' : 'Extraer'} onPress={extract} disabled={loading} />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {data && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>Nombre: {data.recipe_name}</Text>
          {data.prep_time_minutes !== undefined && <Text>Prep (min): {data.prep_time_minutes}</Text>}
          <Text style={{ fontWeight: '600' }}>Ingredientes:</Text>
          {data.ingredients.map((ing, i) => (
            <Text key={i}>- {ing.quantity} {ing.name}</Text>
          ))}
          <Text style={{ fontWeight: '600', marginTop: 8 }}>Instrucciones:</Text>
          {data.instructions.map((step, i) => (
            <Text key={i}>{i + 1}. {step}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
