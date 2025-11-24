import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Usando la paleta de colores Dark que proporcionaste
const COLORS = {
  background: '#121212', // dark.background
  text: '#ffffff',       // dark.text
  primary: '#007bffff',  // dark.primary.500
  secondary: '#555555ff', // dark.neutral.500 (usado para bordes o textos secundarios)
  border: '#333333',     // dark.neutral.700
  inputBg: '#121212',
  surface: '#1E1E1E', // Un poco más claro para contraste si fuera necesario, pero usaremos bg negro
  saveBtn: '#9ca3af', // Grisáceo como en la imagen (simulando estado disabled/neutral)
};

// Reutilizamos la imagen de mascota del profile o un placeholder
import mascotImage from '@/assets/images/mascot/step4.jpeg'; 
// Si no tienes acceso a la imagen aquí, usa un uri placeholder:
// const mascotImage = { uri: 'https://via.placeholder.com/150' };

export default function EditProfileScreen() {
  const router = useRouter();

  // Estados del formulario
  const [firstName, setFirstName] = useState('Jon');
  const [lastName, setLastName] = useState('Doe');
  const [email, setEmail] = useState('alimba@draftbit.com');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [location, setLocation] = useState('some Location');

  const handleSave = () => {
    // Aquí iría tu lógica para guardar en DB
    console.log('Saving changes...', { firstName, lastName, email, gender, location });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Info</Text>
        <View style={{ width: 24 }} /> {/* Espaciador para centrar título */}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={mascotImage} style={styles.avatar} resizeMode="cover" />
            <TouchableOpacity style={styles.editIconContainer}>
              <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={COLORS.secondary}
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={COLORS.secondary}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={COLORS.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              
              {/* Male Button */}
              <TouchableOpacity 
                style={[
                  styles.genderButton, 
                  gender === 'Male' && styles.genderButtonActive
                ]} 
                onPress={() => setGender('Male')}
                activeOpacity={0.8}
              >
                <View style={styles.genderIconContainer}>
                   {gender === 'Male' ? (
                     <View style={styles.radioSelected}>
                        <MaterialCommunityIcons name="check" size={14} color="#fff" />
                     </View>
                   ) : (
                     <View style={styles.radioUnselected} />
                   )}
                </View>
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>

              {/* Female Button */}
              <TouchableOpacity 
                style={[
                  styles.genderButton, 
                  gender === 'Female' && styles.genderButtonActive // Opcional: si quieres highlight en female
                ]} 
                onPress={() => setGender('Female')}
                activeOpacity={0.8}
              >
                 <View style={styles.genderIconContainer}>
                   {gender === 'Female' ? (
                     <View style={styles.radioSelected}>
                        <MaterialCommunityIcons name="check" size={14} color="#fff" />
                     </View>
                   ) : (
                     <View style={styles.radioUnselected} />
                   )}
                </View>
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
                placeholderTextColor={COLORS.secondary}
                multiline
              />
            </View>
          </View>

        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffd966', // Fallback color
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e69b59', // Color naranja/marrón de la imagen
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  // Form
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#999', // Color grisáceo para labels
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
  },
  input: {
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textAreaWrapper: {
    height: 120, // Altura para el text area de location
    justifyContent: 'flex-start',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top', // Para Android
    paddingTop: 14,
  },

  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '48%', // Botones casi mitad y mitad
  },
  genderButtonActive: {
    borderColor: COLORS.border, // En la imagen parece mantener el borde gris, pero el icono cambia
    // Si quieres el borde azul: borderColor: COLORS.primary
  },
  genderIconContainer: {
    marginRight: 10,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary, // Azul
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderText: {
    color: COLORS.text,
    fontSize: 16,
  },

  // Save Button
  saveButton: {
    backgroundColor: '#9ca3af', // Gris de la imagen
    borderRadius: 25, // Bordes muy redondeados
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});