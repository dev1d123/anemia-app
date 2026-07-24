import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { COLORS } from '../theme/colors';
import { Patient } from '../components/PatientSelector';
import { imageProcessor } from '../services/imageProcessor';
import { inferenceEngine, PredictionResult } from '../services/inferenceEngine';
import { dbService, Diagnostico } from '../services/dbService';

interface DiagnosticScreenProps {
  patient: Patient;
}

type Step = 'idle' | 'capturing' | 'analyzing' | 'result';

export const DiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ patient }) => {
  const db = useSQLiteContext();
  const [step, setStep] = useState<Step>('idle');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Diagnostico[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setStep('idle');
    setSaved(false);
    setSavedId(null);
    setResult(null);
    setShowHistory(false);
  }, [patient]);

  useEffect(() => {
    if (step === 'idle') {
      loadHistory();
    }
  }, [patient, step]);

  const loadHistory = async () => {
    try {
      const records = await dbService.getDiagnosticosPorPaciente(db, patient.id);
      setHistory(records);
    } catch (error) {
      console.error('[DiagnosticScreen] Error cargando historial:', error);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso denegado',
        'Se necesita acceso a la cámara para capturar la imagen ocular.'
      );
      return false;
    }
    return true;
  };

  const handleCapture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const photoUri = pickerResult.assets[0].uri;

      setStep('analyzing');

      const processed = await imageProcessor.processCapture(photoUri, patient.id);

      const prediction = await inferenceEngine.runInference(processed, patient);
      setResult(prediction);
      setStep('result');
    } catch (error) {
      console.error('[DiagnosticScreen] Error en captura/análisis:', error);
      setStep('idle');
      Alert.alert('Error', 'Ocurrió un error durante el análisis de la imagen.');
    }
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      const id = await dbService.insertDiagnostico(db, {
        paciente_id: patient.id,
        paciente_nombre: patient.name,
        fecha: new Date().toISOString(),
        imagen_ruta: '',
        hb_estimado: result.hb_estimado,
        nivel_anemia: result.nivel_anemia,
        confianza: Math.round(result.confianza * 1000) / 1000,
        modelo_version: result.modelo_version,
        sincronizado: 0,
        metadata: JSON.stringify(result.metadata),
      });

      setSaved(true);
      setSavedId(id);
      await loadHistory();
      Alert.alert(
        'Guardado',
        `Diagnóstico de ${patient.name} guardado localmente. Pendiente de sincronización Mesh.`
      );
    } catch (error) {
      console.error('[DiagnosticScreen] Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar el diagnóstico localmente.');
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await dbService.deleteDiagnostico(db, id);
      await loadHistory();
    } catch (error) {
      console.error('[DiagnosticScreen] Error al eliminar:', error);
    }
  };

  const getAnemiaColor = (nivel: string) => {
    switch (nivel) {
      case 'Normal':
        return COLORS.secondary;
      case 'Moderada':
        return COLORS.warning;
      case 'Severa':
        return COLORS.error;
      default:
        return COLORS.textMuted;
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Diagnóstico por Conjuntiva Ocular</Text>
        <Text style={styles.sectionDesc}>
          El análisis local procesa los píxeles de la conjuntiva palpebral para estimar los
          niveles de hemoglobina de forma no invasiva.
        </Text>

        {step === 'idle' && (
          <View style={styles.viewfinderContainer}>
            <View style={styles.eyeFrame}>
              <View style={styles.eyeGuideOuter}>
                <View style={styles.eyeGuideInner} />
              </View>
              <Ionicons
                name="eye-outline"
                size={48}
                color={COLORS.primary}
                style={styles.eyeIcon}
              />
              <Text style={styles.frameText}>Posicione el ojo en el recuadro</Text>
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <Ionicons name="camera" size={24} color={COLORS.white} />
              <Text style={styles.captureButtonText}>Iniciar Captura Local</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'analyzing' && (
          <View style={styles.viewfinderContainer}>
            <View style={styles.processingView}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.cameraText, { marginTop: 10 }]}>
                Procesando red neuronal local...
              </Text>
              <Text style={styles.modelLabel}>
                Modelo: Ocular Conjunctiva Image Classifier v
                {inferenceEngine.getModelVersion()}
              </Text>
            </View>
          </View>
        )}

        {step === 'result' && result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Resultado de IA Local</Text>
              <Text style={styles.patientStamp}>{patient.name}</Text>
            </View>

            <View style={styles.resultRow}>
              <View style={styles.resultField}>
                <Text style={styles.resultLabel}>Hb Estimado</Text>
                <Text
                  style={[
                    styles.resultValue,
                    {
                      color:
                        result.nivel_anemia === 'Normal' ? COLORS.secondary : COLORS.accent,
                    },
                  ]}
                >
                  {result.hb_estimado} g/dL
                </Text>
              </View>
              <View style={styles.resultField}>
                <Text style={styles.resultLabel}>Riesgo Predicho</Text>
                <Text
                  style={[
                    styles.resultValue,
                    { color: getAnemiaColor(result.nivel_anemia) },
                  ]}
                >
                  {result.nivel_anemia}
                </Text>
              </View>
            </View>

            <View style={styles.confidenceBanner}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} />
              <Text style={styles.confidenceText}>
                Confianza del modelo: {(result.confianza * 100).toFixed(1)}% (Modelo Offline
                v{result.modelo_version})
              </Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.saveButton, saved && styles.savedButton]}
                onPress={handleSave}
                disabled={saved}
              >
                <Ionicons
                  name={saved ? 'checkmark-done-circle' : 'save-outline'}
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.saveButtonText}>
                  {saved ? 'Guardado Local' : 'Guardar SQLite'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setStep('idle')}
              >
                <Text style={styles.resetButtonText}>Re-evaluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.card, styles.infoCard]}>
        <Ionicons
          name="information-circle"
          size={24}
          color={COLORS.primary}
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Guía de Captura Ocular</Text>
          <Text style={styles.infoText}>
            Asegúrese de contar con luz natural. Presione suavemente el párpado inferior para
            exponer la conjuntiva antes de tomar la fotografía.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.historyToggle}
          onPress={async () => {
            await loadHistory();
            setShowHistory(!showHistory);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.historyTitle}>Historial de Diagnósticos</Text>
          </View>
          <Ionicons
            name={showHistory ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        {showHistory && (
          <>
            {history.length === 0 ? (
              <Text style={styles.historyEmpty}>
                No hay diagnósticos registrados para este paciente.
              </Text>
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => String(item.id_diagnostico)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <View
                        style={[
                          styles.historyDot,
                          { backgroundColor: getAnemiaColor(item.nivel_anemia) },
                        ]}
                      />
                      <View>
                        <Text style={styles.historyHb}>
                          {item.hb_estimado} g/dL —{' '}
                          <Text style={{ color: getAnemiaColor(item.nivel_anemia) }}>
                            {item.nivel_anemia}
                          </Text>
                        </Text>
                        <Text style={styles.historyDate}>{formatDate(item.fecha)}</Text>
                        <Text style={styles.historyMeta}>
                          Confianza: {(item.confianza * 100).toFixed(1)}% | v
                          {item.modelo_version}{' '}
                          {item.sincronizado === 1 ? '| Sincronizado' : '| Pendiente sync'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteHistory(item.id_diagnostico!)}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </>
        )}
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
  eyeFrame: {
    width: '100%',
    height: 220,
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
  eyeGuideOuter: {
    width: 140,
    height: 90,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    position: 'absolute',
  },
  eyeGuideInner: {
    width: 50,
    height: 35,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  eyeIcon: {
    marginBottom: 8,
  },
  frameText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  processingView: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 15,
  },
  cameraText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  modelLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
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
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyEmpty: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  historyHb: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
