import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/theme/colors';
import { Header } from './src/components/Header';
import { PatientSelector, Patient, MOCK_PATIENTS } from './src/components/PatientSelector';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DiagnosticScreen } from './src/screens/DiagnosticScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { PreventionScreen } from './src/screens/PreventionScreen';
import { SyncScreen } from './src/screens/SyncScreen';
import { authService, Session } from './src/services/authService';
import { SQLiteProvider } from 'expo-sqlite';
import { dbService } from './src/services/dbService';

type ScreenName = 'splash' | 'login' | 'register' | 'home' | 'diagnostic' | 'nutrition' | 'prevention' | 'sync';

export default function App() {
  return (
    <SQLiteProvider databaseName="anemia.db" onInit={dbService.initializeDatabase}>
      <AppContent />
    </SQLiteProvider>
  );
}

function AppContent() {
  const [screenStack, setScreenStack] = useState<ScreenName[]>(['splash']);
  const [activePatient, setActivePatient] = useState<Patient>(MOCK_PATIENTS[0]);
  const [session, setSession] = useState<Session | null>(null);

  const currentScreen = screenStack[screenStack.length - 1];

  // Inicializar base de datos local y verificar sesión activa
  useEffect(() => {
    const initialize = async () => {
      await authService.initializeUsers();
      const currentSession = await authService.getCurrentSession();
      if (currentSession) {
        setSession(currentSession);
      }
    };
    initialize();
  }, []);

  const handleSelectPatient = (patient: Patient) => {
    setActivePatient(patient);
  };

  const pushScreen = (screen: ScreenName) => {
    setScreenStack((previousStack) => [...previousStack, screen]);
  };

  const replaceScreen = (screen: ScreenName) => {
    setScreenStack([screen]);
  };

  const goBack = () => {
    setScreenStack((previousStack) =>
      previousStack.length > 1 ? previousStack.slice(0, -1) : previousStack,
    );
  };

  const handleLoginSuccess = async () => {
    const currentSession = await authService.getCurrentSession();
    setSession(currentSession);
    replaceScreen('home');
  };

  const handleRegisterSuccess = async () => {
    const currentSession = await authService.getCurrentSession();
    setSession(currentSession);
    replaceScreen('home');
  };

  const handleGuestAccess = async () => {
    const currentSession = await authService.getCurrentSession();
    setSession(currentSession);
    replaceScreen('home');
  };

  const handleLogout = async () => {
    await authService.logout();
    setSession(null);
    replaceScreen('login');
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'diagnostic':
        return <DiagnosticScreen patient={activePatient} />;
      case 'nutrition':
        return <NutritionScreen patient={activePatient} />;
      case 'prevention':
        return <PreventionScreen patient={activePatient} />;
      case 'sync':
        return <SyncScreen />;
      default:
        return null;
    }
  };

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'diagnostic':
        return 'Diagnóstico Ocular';
      case 'nutrition':
        return 'Recomendación Nutricional';
      case 'prevention':
        return 'Evaluación de Riesgo';
      case 'sync':
        return 'Sincronización Mesh';
      default:
        return 'Monitor Anemia AI';
    }
  };

  const getScreenSubtitle = () => {
    switch (currentScreen) {
      case 'diagnostic':
        return 'Diagnóstico local no invasivo';
      case 'nutrition':
        return 'Nutrición y suplementación';
      case 'prevention':
        return 'Alertas y determinantes';
      case 'sync':
        return 'Transmisión LoRa Offline';
      default:
        return 'Salud Infantil Rural';
    }
  };

  const handleSplashFinish = () => {
    if (session) {
      replaceScreen('home');
    } else {
      replaceScreen('login');
    }
  };

  if (currentScreen === 'splash') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <LoginScreen
          onLogin={handleLoginSuccess}
          onGoToRegister={() => replaceScreen('register')}
          onGuestAccess={handleGuestAccess}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'register') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <RegisterScreen
          onCreateAccount={handleRegisterSuccess}
          onGoToLogin={() => replaceScreen('login')}
          onGuestAccess={handleGuestAccess}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'home') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Header 
          title={getScreenTitle()} 
          subtitle={getScreenSubtitle()} 
          showBackButton={false} 
          userName={session?.isGuest ? 'Invitado' : session?.user?.name}
          onLogout={handleLogout}
        />
        <View style={styles.mainContainer}>
          <HomeScreen
            selectedPatient={activePatient}
            onSelectPatient={handleSelectPatient}
            onOpenModule={pushScreen}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title={getScreenTitle()}
        subtitle={getScreenSubtitle()}
        showBackButton={true}
        onBackPress={goBack}
        userName={session?.isGuest ? 'Invitado' : session?.user?.name}
        onLogout={handleLogout}
      />
      <View style={styles.activeScreenContainer}>{renderActiveScreen()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContainer: {
    flex: 1,
  },
  activeScreenContainer: {
    flex: 1,
  },
});
