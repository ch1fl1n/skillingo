// app/modal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ModalPostScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <TextInput
          placeholder="Title (Max 50 characters)"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />

        {/* Body */}
        <TextInput
          placeholder="Write something..."
          placeholderTextColor="#6b7280"
          multiline
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
        />

        {/* Category dropdown (fake for now) */}
        <TouchableOpacity style={styles.dropdown} onPress={() => {/* abrir modal/categories */}}>
          <Text style={styles.dropdownText}>
            {category ? category : 'Select Category'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={22} color="#9ca3af" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* Guidelines */}
        <Text style={styles.guidelines}>
          Content Guidelines: Posts should be respectful, relevant, and contribute positively to the community. Inappropriate content will be removed.
        </Text>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.draftBtn} onPress={() => {/* guardar draft */}}>
            <Text style={styles.draftText}>Save as Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={() => {/* submit */}}>
            <Text style={styles.submitText}>Submit for Review</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* styles: puedes copiar exactamente los tuyos o usar estos (mantienen colores) */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', paddingHorizontal: 18, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  closeBtn: { position: 'absolute', left: 0 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  input: { backgroundColor: '#0f1113', color: '#e5e7eb', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#161616', fontSize: 14, marginBottom: 14 },
  textArea: { minHeight: 140, textAlignVertical: 'top' },
  dropdown: { backgroundColor: '#0f1113', borderRadius: 10, borderWidth: 1, borderColor: '#161616', paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  dropdownText: { color: '#d1d5db', flex: 1, fontSize: 14 },
  guidelines: { color: '#c1c5c9', fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 20 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  draftBtn: { backgroundColor: '#2d2d2d', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, flex: 1, marginRight: 10 },
  draftText: { color: '#e5e7eb', textAlign: 'center', fontWeight: '600' },
  submitBtn: { backgroundColor: '#00aaffff', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, flex: 1 },
  submitText: { color: '#000', textAlign: 'center', fontWeight: '700' },
});
