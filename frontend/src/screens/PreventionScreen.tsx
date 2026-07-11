import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { Patient } from '../components/PatientSelector';

interface PreventionScreenProps {
  patient: Patient;
}

export const PreventionScreen: React.FC<PreventionScreenProps> = ({ patient }) => {
  const [hasWater, setHasWater] = useState(false);
  const [hasSanitation, setHasSanitation] = useState(false);
  const [hasCred, setHasCred] = useState(true);
  const [hasSupplement, setHasSupplement] = useState(false);

  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High' | null>(null);

  useEffect(() => {
    // Restablecer al cambiar de paciente
    setRiskLevel(null);
  }, [patient]);

  const handleCalculateRisk = () => {
    // Lógica simple de cálculo de riesgo ambiental/nutricional
    let negativePoints = 0;
    if (!hasWater) negativePoints++;
    if (!hasSanitation) negativePoints++;
    if (!hasCred) negativePoints++;
    if (!hasSupplement) negativePoints++;

    if (patient.hbStatus === 'Severa') negativePoints += 2;
    else if (patient.hbStatus === 'Moderada') negativePoints += 1;

    if (negativePoints >= 4) {
      setRiskLevel('High');
    } else if (negativePoints >= 2) {
      setRiskLevel('Medium');
    } else {
      setRiskLevel('Low');
    }
  };

  const getRiskStyle = () => {
    switch (riskLevel) {
      case 'Low':
        return {
          bg: COLORS.secondaryLight,
          text: COLORS.secondary,
          desc: 'Entorno controlado y protector. Mantenga prácticas higiénicas estándar.',
          icon: 'checkmark-circle',
        };
      case 'Medium':
        return {
          bg: '#FFF3CD',
          text: '#856404',
          desc: 'Riesgo moderado. Se recomienda hervir agua y monitorear suplementos.',
          icon: 'alert-circle',
        };
      case 'High':
        return {
          bg: COLORS.accentLight,
          text: COLORS.accent,
          desc: 'Riesgo alto de parasitosis o recaída de anemia. Requiere intervención inmediata del promotor de salud.',
          icon: 'warning',
        };
      default:
        return { bg: COLORS.background, text: COLORS.textMuted, desc: '', icon: '' };
    }
  };

  const riskStyle = getRiskStyle();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Explicación inicial */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Evaluación de Riesgo del Entorno</Text>
        <Text style={styles.sectionDesc}>
          Formulario predictivo offline para estimar la vulnerabilidad familiar basándose en determinantes sociales de salud (agua, saneamiento y controles médicos).
        </Text>

        {/* Cuestionario */}
        <View style={styles.questionContainer}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchTitle}>¿Agua Potable Segura?</Text>
              <Text style={styles.switchDesc}>Acceso a agua tratada o hervida en casa</Text>
            </View>
            <Switch
              value={hasWater}
              onValueChange={setHasWater}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={hasWater ? COLORS.white : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchTitle}>¿Saneamiento Básico?</Text>
              <Text style={styles.switchDesc}>Conexión a desagüe o pozo séptico higiénico</Text>
            </View>
            <Switch
              value={hasSanitation}
              onValueChange={setHasSanitation}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={hasSanitation ? COLORS.white : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchTitle}>¿Controles CRED al día?</Text>
              <Text style={styles.switchDesc}>Control de crecimiento y desarrollo infantil al día</Text>
            </View>
            <Switch
              value={hasCred}
              onValueChange={setHasCred}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={hasCred ? COLORS.white : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchTitle}>¿Suplemento Regular?</Text>
              <Text style={styles.switchDesc}>Cumple dosis diaria sin interrupciones</Text>
            </View>
            <Switch
              value={hasSupplement}
              onValueChange={setHasSupplement}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={hasSupplement ? COLORS.white : '#f4f3f4'}
            />
          </View>
        </View>

        {!riskLevel ? (
          <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculateRisk}>
            <Ionicons name="calculator-outline" size={20} color={COLORS.white} />
            <Text style={styles.calculateBtnText}>Evaluar Riesgo Familiar</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.riskResultBox, { backgroundColor: riskStyle.bg }]}>
            <View style={styles.riskHeader}>
              <Ionicons name={riskStyle.icon as keyof typeof Ionicons.glyphMap} size={24} color={riskStyle.text} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[styles.riskLabel, { color: riskStyle.text }]}>NIVEL DE RIESGO</Text>
                <Text style={[styles.riskValue, { color: riskStyle.text }]}>
                  {riskLevel === 'Low' ? 'BAJO' : riskLevel === 'Medium' ? 'MEDIO' : 'ALTO'}
                </Text>
              </View>
            </View>
            <Text style={[styles.riskDesc, { color: riskStyle.text }]}>{riskStyle.desc}</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={() => setRiskLevel(null)}>
              <Text style={[styles.resetBtnText, { color: riskStyle.text }]}>Re-evaluar Encuesta</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Alertas preventivas */}
      <View style={[styles.card, styles.alertCard]}>
        <Text style={styles.alertCardTitle}>Alertas Epidemiológicas Locales</Text>
        <View style={styles.alertItem}>
          <Ionicons name="alert-circle" size={18} color={COLORS.accent} />
          <Text style={styles.alertText}>
            En la comunidad actual, el 45% de casos de anemia están asociados a parasitosis intestinal por agua no hervida.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  switchDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  calculateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  calculateBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  riskResultBox: {
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  riskValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  riskDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 15,
  },
  resetBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertCard: {
    borderColor: COLORS.accentLight,
  },
  alertCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
    flex: 1,
  },
});
