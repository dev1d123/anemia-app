import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { TextField } from '../components/auth/TextField';

interface RegisterScreenProps {
  onCreateAccount: () => void;
  onGoToLogin: () => void;
  onGuestAccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onCreateAccount, onGoToLogin, onGuestAccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Completa tu nombre, correo electrónico y contraseña para crear la cuenta.');
      return;
    }

    onCreateAccount();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.brandMark}>
            <Ionicons name="person-add-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.kicker}>Registro rápido</Text>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>
            Registra un perfil nuevo y entra al Home sin fricción con el mismo estilo visual del sistema.
          </Text>
        </View>

        <View style={styles.card}>
          <TextField
            label="Nombre completo"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tu nombre y apellido"
            autoCapitalize="words"
          />
          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Crea una contraseña"
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword((previousValue) => !previousValue)}
          />

          <PrimaryButton title="Crear Cuenta" onPress={handleSubmit} iconName="sparkles-outline" />

          <PrimaryButton
            title="Saltar por ahora"
            onPress={onGuestAccess}
            variant="secondary"
            iconName="arrow-forward-outline"
          />

          <TouchableOpacity style={styles.linkRow} onPress={onGoToLogin} activeOpacity={0.75}>
            <Text style={styles.linkPrefix}>¿Ya tienes cuenta?</Text>
            <Text style={styles.linkAction}> Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 18,
  },
  brandMark: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.text,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 320,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  linkPrefix: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  linkAction: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '800',
  },
});