import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { Patient } from '../components/PatientSelector';

interface DiagnosticScreenProps {
  patient: Patient;
}

export const DiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ patient }) => {
  const [step, setStep] = useState<'idle' | 'capturing' | 'analyzing' | 'result'>('idle');
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Restablece el flujo si cambia el paciente
    setStep('idle');
    setSaved(false);
    setProgress(0);
  }, [patient]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'analyzing') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep('result');
            return 100;
          }
          return prev + 15;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleCapture = () => {
    setStep('capturing');
    setTimeout(() => {
      setStep('analyzing');
    }, 1500); // Simula la toma de foto
  };

  const handleSave = () => {
    setSaved(true);
    Alert.alert(
      'Guardado',
      `Diagnóstico de ${patient.name} guardado localmente en SQLite. Pendiente de sincronización Mesh.`
    );
  };

  const getHbEstimate = () => {
    switch (patient.hbStatus) {
      case 'Normal': return '11.4 g/dL';
      case 'Moderada': return '9.5 g/dL';
      case 'Severa': return '8.2 g/dL';
      default: return '10.0 g/dL';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Diagnóstico por Conjuntiva Ocular</Text>
        <Text style={styles.sectionDesc}>
          El análisis local procesa los pixeles de la conjuntiva palpebral para estimar los niveles de hemoglobina de forma no invasiva.
        </Text>

        {step === 'idle' && (
          <View style={styles.viewfinderContainer}>
            <View style={styles.mockCameraView}>
              <Ionicons name="eye-outline" size={48} color={COLORS.primary} style={styles.eyeIcon} />
              <Text style={styles.cameraText}>Posicione el ojo en el recuadro</Text>
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <Ionicons name="camera" size={24} color={COLORS.white} />
              <Text style={styles.captureButtonText}>Iniciar Captura Local</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'capturing' && (
          <View style={styles.viewfinderContainer}>
            <View style={[styles.mockCameraView, styles.capturingView]}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={[styles.cameraText, { color: COLORS.accent, marginTop: 10 }]}>
                Enfocando y tomando captura ocular...
              </Text>
            </View>
          </View>
        )}

        {step === 'analyzing' && (
          <View style={styles.viewfinderContainer}>
            <View style={styles.mockCameraView}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.cameraText, { marginTop: 10 }]}>
                Procesando red neuronal local... {progress}%
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>
        )}

        {step === 'result' && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Resultado de IA Local</Text>
              <Text style={styles.patientStamp}>{patient.name}</Text>
            </View>

            <View style={styles.resultRow}>
              <View style={styles.resultField}>
                <Text style={styles.resultLabel}>Hb Estimado</Text>
                <Text style={[styles.resultValue, { color: patient.hbStatus === 'Normal' ? COLORS.secondary : COLORS.accent }]}>
                  {getHbEstimate()}
                </Text>
              </View>
              <View style={styles.resultField}>
                <Text style={styles.resultLabel}>Riesgo Predicho</Text>
                <Text style={[styles.resultValue, { color: patient.hbStatus === 'Normal' ? COLORS.secondary : COLORS.accent }]}>
                  {patient.hbStatus}
                </Text>
              </View>
            </View>

            <View style={styles.confidenceBanner}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} />
              <Text style={styles.confidenceText}>Confianza del modelo: 94.2% (Modelo Offline V2.1)</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.saveButton, saved && styles.savedButton]}
                onPress={handleSave}
                disabled={saved}
              >
                <Ionicons name={saved ? "checkmark-done-circle" : "save-outline"} size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {saved ? 'Guardado Local' : 'Guardar SQLite'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={() => setStep('idle')}>
                <Text style={styles.resetButtonText}>Re-evaluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.card, styles.infoCard]}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Guía de Captura Ocular</Text>
          <Text style={styles.infoText}>
            Asegúrese de contar con luz natural. Presione suavemente el párpado inferior para exponer la conjuntiva antes de tomar la fotografía.
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
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  viewfinderContainer: {
    alignItems: 'center',
  },
  mockCameraView: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: '#F0F5F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 15,
  },
  capturingView: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  eyeIcon: {
    marginBottom: 10,
  },
  cameraText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  captureButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  progressTrack: {
    width: '80%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  resultContainer: {
    width: '100%',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  patientStamp: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  resultField: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  confidenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 20,
  },
  confidenceText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  savedButton: {
    backgroundColor: COLORS.textMuted,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  resetButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF6F8',
    borderColor: '#BFE1E7',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 16,
  },
});
