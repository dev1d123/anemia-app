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

type ScreenName = 'splash' | 'login' | 'register' | 'home' | 'diagnostic' | 'nutrition' | 'prevention' | 'sync';

export default function App() {
  const [screenStack, setScreenStack] = useState<ScreenName[]>(['splash']);
  const [activePatient, setActivePatient] = useState<Patient>(MOCK_PATIENTS[0]);

  const currentScreen = screenStack[screenStack.length - 1];

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

  useEffect(() => {
    if (currentScreen !== 'splash') {
      return;
    }

    const timeoutId = setTimeout(() => {
      replaceScreen('login');
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [currentScreen]);

  const openHome = () => {
    replaceScreen('home');
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

  if (currentScreen === 'splash') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <SplashScreen onFinish={() => replaceScreen('login')} />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <LoginScreen
          onLogin={openHome}
          onGoToRegister={() => replaceScreen('register')}
          onGuestAccess={openHome}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'register') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <RegisterScreen
          onCreateAccount={openHome}
          onGoToLogin={() => replaceScreen('login')}
          onGuestAccess={openHome}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'home') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Header title={getScreenTitle()} subtitle={getScreenSubtitle()} showBackButton={false} />
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
        showBackButton={currentScreen !== 'home'}
        onBackPress={goBack}
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
