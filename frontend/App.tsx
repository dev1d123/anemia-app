import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/theme/colors';
import { Header } from './src/components/Header';
import { PatientSelector, Patient, MOCK_PATIENTS } from './src/components/PatientSelector';
import { ModuleCard } from './src/components/ModuleCard';
import { DiagnosticScreen } from './src/screens/DiagnosticScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { PreventionScreen } from './src/screens/PreventionScreen';
import { SyncScreen } from './src/screens/SyncScreen';

type ScreenName = 'home' | 'diagnostic' | 'nutrition' | 'prevention' | 'sync';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [activePatient, setActivePatient] = useState<Patient>(MOCK_PATIENTS[0]);

  const handleSelectPatient = (patient: Patient) => {
    setActivePatient(patient);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title={getScreenTitle()}
        subtitle={getScreenSubtitle()}
        showBackButton={currentScreen !== 'home'}
        onBackPress={() => setCurrentScreen('home')}
      />

      {currentScreen === 'home' ? (
        <View style={styles.mainContainer}>
          {/* Selector de Pacientes */}
          <PatientSelector
            selectedPatient={activePatient}
            onSelectPatient={handleSelectPatient}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.menuTitle}>Módulos Disponibles</Text>

            <ModuleCard
              title="Diagnóstico Ocular"
              description="Evaluación de conjuntiva ocular mediante inteligencia artificial offline."
              iconName="camera"
              iconBgColor={COLORS.primaryLight}
              iconColor={COLORS.primary}
              statusText="Listo Offline"
              statusType="success"
              onPress={() => setCurrentScreen('diagnostic')}
            />

            <ModuleCard
              title="Nutrición Rural"
              description="Sugerencias de alimentación infantil con insumos locales y dosis de hierro."
              iconName="restaurant"
              iconBgColor={COLORS.secondaryLight}
              iconColor={COLORS.secondary}
              statusText="Personalizado"
              statusType="info"
              onPress={() => setCurrentScreen('nutrition')}
            />

            <ModuleCard
              title="Evaluación de Riesgo"
              description="Encuesta predictiva sobre determinantes sociales y alertas sanitarias."
              iconName="shield-checkmark"
              iconBgColor={COLORS.accentLight}
              iconColor={COLORS.accent}
              statusText="Pendiente"
              statusType="warning"
              onPress={() => setCurrentScreen('prevention')}
            />

            <ModuleCard
              title="Sincronización Mesh"
              description="Transmisión y recepción de historiales clínicos sin internet vía LoRa."
              iconName="sync"
              iconBgColor={COLORS.primaryLight}
              iconColor={COLORS.primary}
              statusText="Cola Activa (3)"
              statusType="info"
              onPress={() => setCurrentScreen('sync')}
            />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.activeScreenContainer}>{renderActiveScreen()}</View>
      )}
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    marginTop: 10,
  },
  activeScreenContainer: {
    flex: 1,
  },
});
