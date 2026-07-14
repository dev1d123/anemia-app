import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { TextField } from '../components/auth/TextField';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLogin: () => void;
  onGoToRegister: () => void;
  onGuestAccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoToRegister, onGuestAccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Completa tu correo electrónico y contraseña para continuar.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(email, password);
      onLogin();
    } catch (error: any) {
      Alert.alert('Error de acceso', error.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setIsLoading(true);
    try {
      await authService.guestLogin();
      onGuestAccess();
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder como invitado localmente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.brandMark}>
            <Ionicons name="pulse" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.kicker}>Acceso seguro</Text>
          <Text style={styles.title}>Inicia sesión para continuar</Text>
          <Text style={styles.subtitle}>
            Accede a la monitorización clínica, nutrición y sincronización local desde un flujo rápido y limpio.
          </Text>
        </View>

        <View style={styles.card}>
          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Ingresa tu contraseña"
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword((previousValue) => !previousValue)}
            editable={!isLoading}
          />

          <PrimaryButton 
            title="Iniciar Sesión" 
            onPress={handleSubmit} 
            iconName="log-in-outline" 
            loading={isLoading}
          />

          <PrimaryButton
            title="Explorar como invitado"
            onPress={handleGuestAccess}
            variant="secondary"
            iconName="compass-outline"
            disabled={isLoading}
          />

          <TouchableOpacity 
            style={styles.linkRow} 
            onPress={onGoToRegister} 
            activeOpacity={0.75}
            disabled={isLoading}
          >
            <Text style={styles.linkPrefix}>¿No tienes cuenta?</Text>
            <Text style={styles.linkAction}> Regístrate aquí</Text>
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
    color: COLORS.secondary,
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