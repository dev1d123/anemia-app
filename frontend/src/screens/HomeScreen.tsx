import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { PatientSelector, Patient } from '../components/PatientSelector';
import { ModuleCard } from '../components/ModuleCard';

interface HomeScreenProps {
  selectedPatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  onOpenModule: (screen: 'diagnostic' | 'nutrition' | 'prevention' | 'sync') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ selectedPatient, onSelectPatient, onOpenModule }) => {
  return (
    <View style={styles.container}>
      <PatientSelector selectedPatient={selectedPatient} onSelectPatient={onSelectPatient} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.menuTitle}>Módulos Disponibles</Text>

        <ModuleCard
          title="Diagnóstico Ocular"
          description="Evaluación de conjuntiva ocular mediante inteligencia artificial offline."
          iconName="camera"
          iconBgColor={COLORS.primaryLight}
          iconColor={COLORS.primary}
          statusText="Listo Offline"
          statusType="success"
          onPress={() => onOpenModule('diagnostic')}
        />

        <ModuleCard
          title="Nutrición Rural"
          description="Sugerencias de alimentación infantil con insumos locales y dosis de hierro."
          iconName="restaurant"
          iconBgColor={COLORS.secondaryLight}
          iconColor={COLORS.secondary}
          statusText="Personalizado"
          statusType="info"
          onPress={() => onOpenModule('nutrition')}
        />

        <ModuleCard
          title="Evaluación de Riesgo"
          description="Encuesta predictiva sobre determinantes sociales y alertas sanitarias."
          iconName="shield-checkmark"
          iconBgColor={COLORS.accentLight}
          iconColor={COLORS.accent}
          statusText="Pendiente"
          statusType="warning"
          onPress={() => onOpenModule('prevention')}
        />

        <ModuleCard
          title="Sincronización Mesh"
          description="Transmisión y recepción de historiales clínicos sin internet vía LoRa."
          iconName="sync"
          iconBgColor={COLORS.primaryLight}
          iconColor={COLORS.primary}
          statusText="Cola Activa (3)"
          statusType="info"
          onPress={() => onOpenModule('sync')}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});