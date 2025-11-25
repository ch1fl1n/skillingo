// app/Not_seen/EditProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadUriToStorage, getPublicUrlForPath } from '@/lib/storage';
import mascotImage from '@/assets/images/mascot/step4.jpeg'; // fallback

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // UI form state
  const [firstName, setFirstName] = useState('Jon');
  const [lastName, setLastName] = useState('Doe');
  const [email, setEmail] = useState('alimba@draftbit.com');
  // gender stored as plain text in users.gender column
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [location, setLocation] = useState('some Location');

  // avatar state
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // preview url or local uri (native)
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // request permissions proactively on native (optional)
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          await ImagePicker.requestCameraPermissionsAsync();
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        } catch (e) {
          // ignore permission request error
          console.warn('permission request error', e);
        }
      }
    })();
  }, []);

  // Load existing user row from `users` table (use only columns we know exist)
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      try {
        // only request existing columns to avoid 400 errors
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email, avatar_path, avatar_url, gender, location')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('loadProfile supabase error', error);
        }

        if (!mounted) return;
        const row = data;
        if (row) {
          // split username into first/last for ui convenience
          if (row.username) {
            const parts = (row.username as string).split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }
          if (row.email) setEmail(row.email);

          // Resolve avatar: prefer avatar_url; otherwise attempt to create public url from avatar_path
          if (row.avatar_url) {
            setAvatarUri(row.avatar_url);
          } else if (row.avatar_path) {
            // getPublicUrlForPath returns public http url if bucket public
            const pub = getPublicUrlForPath('Profile_image', row.avatar_path);
            if (pub) setAvatarUri(pub);
            else {
              // private bucket: can't preview directly; keep null (UI fallback will show mascot)
              setAvatarUri(null);
            }
          } else {
            setAvatarUri(null);
          }

          // gender/location columns exist per your schema, use them
          if (row.gender) setGender(row.gender === 'Female' ? 'Female' : 'Male');
          if (row.location) setLocation(row.location);
        }
      } catch (err) {
        console.warn('loadProfile unexpected error', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Upload local uri to supabase storage and update users table
  async function uploadAndSave(uri: string) {
    if (!user?.id) return Alert.alert('Error', 'Usuario no autenticado.');
    setUploading(true);
    try {
      // Verificar sesión actual (evita subir sin token)
      const { data: sessionData } = await supabase.auth.getSession();
      const session = (sessionData as { session?: unknown })?.session ?? null;
      if (!session) {
        throw new Error('No active session. Asegúrate de estar autenticado antes de subir.');
      }

      // genera nombre único
      const ext = uri.split('.').pop()?.split(/\#|\?/)[0] ?? 'jpg';
      const filename = `${user.id}/profile_${Date.now()}.${ext}`;
      const bucket = 'Profile_image';

      console.log('[uploadAndSave] uploading', { uri, bucket, filename });

      const { path, error: uploadErr } = await uploadUriToStorage(uri, bucket, filename, { upsert: true });
      if (uploadErr || !path) {
        console.error('uploadUriToStorage returned error', uploadErr);
        throw uploadErr || new Error('Error subiendo el archivo');
      }

      // intentar obtener public URL
      const publicUrl = getPublicUrlForPath(bucket, path);

      // si no hay publicUrl, crear signed url temporal para preview
      let previewUrl: string | null = publicUrl ?? null;
      if (!previewUrl) {
        try {
          const { data: signedData, error: signedErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
          if (!signedErr && (signedData as { signedUrl?: string })?.signedUrl) previewUrl = (signedData as { signedUrl?: string }).signedUrl;
        } catch (e) {
          console.warn('createSignedUrl fallback error', e);
        }
      }

      // actualizar fila users: guardamos avatar_path siempre (autoridad)
      const updatePayload: { avatar_path: string; avatar_url?: string | null } = { avatar_path: path };
      if (publicUrl) updatePayload.avatar_url = publicUrl;
      else updatePayload.avatar_url = null;

      const { error: dbErr } = await supabase.from('users').update(updatePayload).eq('id', user.id);
      if (dbErr) {
        console.error('Error updating users avatar fields', dbErr);
        throw dbErr;
      }

      // actualizar preview en UI
      if (previewUrl) setAvatarUri(previewUrl);
      else setAvatarUri(null);

      // opcional: notificar other parts of app (realtime) — aquí simple success
      Alert.alert('Éxito', 'Imagen de perfil actualizada');
    } catch (err) {
      console.error('uploadAndSave', err);
      Alert.alert('Error', String((err as Error).message || err));
    } finally {
      setUploading(false);
    }
  }

  // Pick image from gallery
  async function pickFromGallery() {
    try {
      // On web, this will open file picker; result shapes differ between SDK versions
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        base64: false,
      });

      // normalize cancellation for old/new APIs
      // @ts-expect-error ImagePicker API varies between versions
      const canceled = typeof (res as { canceled?: boolean }).canceled === 'boolean' ? (res as { canceled?: boolean }).canceled : (res as { cancelled?: boolean }).cancelled;
      if (canceled) return;

      // @ts-expect-error ImagePicker API varies between versions
      const uri = (res as { assets?: { uri: string }[] }).assets?.[0]?.uri ?? (res as { uri?: string }).uri;
      if (!uri) return;

      // resize/compress
      const processed = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      setAvatarUri(processed.uri);
      await uploadAndSave(processed.uri);
    } catch (err) {
      console.error('pickFromGallery', err);
      Alert.alert('Error', String((err as Error).message || err));
    }
  }

  // Take photo (native only)
  async function takePhoto() {
    try {
      if (Platform.OS === 'web') {
        return Alert.alert('No soportado', 'La cámara no está disponible en web desde este flujo.');
      }

      // request permission if needed
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      const granted =
        // some SDKs return boolean `granted`, others return { status: 'granted' }
        (perm as { granted?: boolean }).granted ?? (perm as { status?: string }).status === 'granted';

      if (!granted) {
        return Alert.alert('Permisos', 'Permiso de cámara denegado');
      }

      const res = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      // normalize cancellation
      // @ts-expect-error ImagePicker API varies between versions
      const canceled = typeof (res as { canceled?: boolean }).canceled === 'boolean' ? (res as { canceled?: boolean }).canceled : (res as { cancelled?: boolean }).cancelled;
      if (canceled) return;

      // @ts-expect-error ImagePicker API varies between versions
      const uri = (res as { assets?: { uri: string }[] }).assets?.[0]?.uri ?? (res as { uri?: string }).uri;
      if (!uri) return;

      const processed = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      setAvatarUri(processed.uri);
      await uploadAndSave(processed.uri);
    } catch (err) {
      console.error('takePhoto', err);
      Alert.alert('Error', String((err as Error).message || err));
    }
  }

  function onEditAvatarPress() {
    Alert.alert('Cambiar foto', 'Selecciona origen', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tomar foto', onPress: () => void takePhoto() },
      { text: 'Seleccionar de galería', onPress: () => void pickFromGallery() },
    ]);
  }

  // Save profile: update users table columns: username, email, gender, location
  async function handleSave() {
    if (!user?.id) return Alert.alert('Error', 'Usuario no autenticado');

    const username = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() || null;

    // build payload that matches the users table columns
    const userData: { username?: string; email?: string; gender: 'Male' | 'Female'; location: string } = {};
    if (username !== null) userData.username = username;
    if (email) userData.email = email;
    // gender & location columns exist (option C) -> include directly
    userData.gender = gender;
    userData.location = location;

    try {
      const { error } = await supabase.from('users').update(userData).eq('id', user.id);
      if (error) throw error;

      Alert.alert('Guardado', 'Cambios guardados correctamente');
      router.back();
    } catch (err) {
      console.error('save profile', err);
      // If we get a column-related error (unexpected) show actionable message
      const msg = (err as Error)?.message ?? JSON.stringify(err);
      Alert.alert('Error', 'No se pudo guardar: ' + msg);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              // If on web and avatarUri is a file:// or /mnt/data path, avoid using it (web can't access).
              // avatarUri should be http(s) on web. fallback to mascotImage.
              source={avatarUri ? { uri: avatarUri } : mascotImage}
              style={styles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.editIconContainer} onPress={onEditAvatarPress} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <MaterialCommunityIcons name="pencil" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* First name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor="#999" />
            </View>
          </View>

          {/* Last name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor="#999" />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity style={[styles.genderButton, gender === 'Male' && styles.genderButtonActive]} onPress={() => setGender('Male')} activeOpacity={0.8}>
                <View style={styles.genderIconContainer}>
                  {gender === 'Male' ? <View style={styles.radioSelected}><MaterialCommunityIcons name="check" size={14} color="#fff" /></View> : <View style={styles.radioUnselected} />}
                </View>
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.genderButton, gender === 'Female' && styles.genderButtonActive]} onPress={() => setGender('Female')} activeOpacity={0.8}>
                <View style={styles.genderIconContainer}>
                  {gender === 'Female' ? <View style={styles.radioSelected}><MaterialCommunityIcons name="check" size={14} color="#fff" /></View> : <View style={styles.radioUnselected} />}
                </View>
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#777', fontSize: 12, marginTop: 6 }}>
              Los cambios se guardarán en las columnas gender y location de la tabla users.
            </Text>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput style={[styles.input, styles.textArea]} value={location} onChangeText={setLocation} placeholder="Location" placeholderTextColor="#999" multiline />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading || loadingProfile}>
          {uploading || loadingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },

  content: { flex: 1, paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', marginVertical: 24 },
  avatarContainer: { position: 'relative', width: 100, height: 100 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ffd966' },
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#e69b59', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#121212' },

  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#999', fontSize: 14, marginBottom: 8 },
  inputWrapper: { borderWidth: 1, borderColor: '#333', borderRadius: 8, backgroundColor: '#121212', justifyContent: 'center' },
  input: { color: '#fff', paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },

  // gender
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  genderButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, width: '48%' },
  genderButtonActive: { borderColor: '#00d4ff' },
  genderIconContainer: { marginRight: 10 },
  radioUnselected: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#666' },
  radioSelected: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#00d4ff', justifyContent: 'center', alignItems: 'center' },
  genderText: { color: '#fff', fontSize: 16 },

  textAreaWrapper: { height: 100, justifyContent: 'flex-start' },
  textArea: { height: '100%', textAlignVertical: 'top', paddingTop: 14 },

  saveButton: { backgroundColor: '#9ca3af', borderRadius: 25, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
