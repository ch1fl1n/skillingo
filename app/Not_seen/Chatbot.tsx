import React, { useState } from 'react';
import { View, TextInput, Button, ScrollView, Text, ActivityIndicator } from 'react-native';
import { safeGenerateChat, approximateTokens, ChatMessage } from '../../lib/gemini';

export default function Chatbot() {
	const [prompt, setPrompt] = useState('');
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function send() {
		if (!prompt.trim() || loading) return;
		const userMsg = { role: 'user' as const, text: prompt.trim() };
		setMessages(m => [...m, userMsg]);
		setPrompt('');
		setLoading(true);
		setError(null);
		const result = await safeGenerateChat([...messages, userMsg]);
		setLoading(false);
		if (!result.ok) {
			setError(result.error || 'Error');
			return;
		}
		setMessages(m => [...m, { role: 'model', text: result.text! }]);
	}

	const tokenEstimate = approximateTokens(messages.map(m => m.text).join('\n'));

	function clear() {
		if (loading) return;
		setMessages([]);
		setError(null);
	}

	return (
		<View style={{ flex: 1, padding: 16 }}>
			<ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }}>
				{messages.map((m, i) => (
					<View key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
						<Text style={{ fontWeight: '600', marginBottom: 4 }}>{m.role === 'user' ? 'Tú' : 'Gemini'}</Text>
						<Text>{m.text}</Text>
					</View>
				))}
				{loading && <ActivityIndicator />}
				{error && <Text style={{ color: 'red' }}>{error}</Text>}
			</ScrollView>
			<Text style={{ marginTop: 4, fontSize: 12, color: '#666' }}>Tokens aprox: {tokenEstimate}</Text>
			<View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
				<TextInput
					style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
					placeholder="Escribe tu mensaje"
					value={prompt}
					onChangeText={setPrompt}
				/>
				<Button title="Enviar" onPress={send} />
				<Button title="Limpiar" onPress={clear} />
			</View>
		</View>
	);
}

