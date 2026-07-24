import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { Patient } from '../components/PatientSelector';
import { gemmaService } from '../services/gemma_service';
import { storageService } from '../services/storage_service';
import { riskAnalyzer } from '../services/risk_analyzer';
import { EnvironmentRisk } from '../models/environment_risk';

interface PreventionScreenProps {
  patient: Patient;
}

type Step = 'idle' | 'capturing' | 'analyzing' | 'result';

export const PreventionScreen: React.FC<PreventionScreenProps> = ({ patient }) => {
  const [step, setStep] = useState<Step>('idle');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [riskResult, setRiskResult] = useState<EnvironmentRisk | null>(null);
  const [saved, setSaved] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await gemmaService.loadModel();
        const ready = gemmaService.isModelReady();
        setIsModelReady(ready);
      } catch (error) {
        console.log('Error cargando modelo:', error);
        setIsModelReady(false);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    setStep('idle');
    setImagePath(null);
    setRiskResult(null);
    setSaved(false);
  }, [patient]);

  const showImageSourceOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar Foto', 'Elegir de Galeria'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: -1,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handlePickFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Seleccionar imagen',
        '¿Como quieres obtener la imagen?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tomar Foto', onPress: handleTakePhoto },
          { text: 'Elegir de Galería', onPress: handlePickFromGallery },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      setStep('capturing');
      const path = await gemmaService.takePicture();
      if (path) {
        setImagePath(path);
        await analyzeImage(path);
      } else {
        Alert.alert('Error', 'No se pudo tomar la foto.');
        setStep('idle');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrio un error al tomar la foto.');
      setStep('idle');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setStep('capturing');
      const path = await gemmaService.pickImageFromGallery();
      if (path) {
        setImagePath(path);
        await analyzeImage(path);
      } else {
        Alert.alert('Error', 'No se pudo cargar la imagen.');
        setStep('idle');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrio un error al cargar la imagen.');
      setStep('idle');
    }
  };

  const analyzeImage = async (path: string) => {
    try {
      setStep('analyzing');
      setIsLoading(true);

      const gemmaResult = await gemmaService.analyzeImage(path);

      const risk = riskAnalyzer.analyzeRisks({
        patientId: patient.id,
        imagePath: path,
        gemmaResult: gemmaResult,
      });

      setRiskResult(risk);
      setStep('result');
      setIsLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Error al analizar la imagen.');
      setStep('idle');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!riskResult) return;

    try {
      await storageService.saveRiskAssessment(riskResult);
      setSaved(true);
      Alert.alert(
        'Guardado Exitoso',
        `Evaluacion de entorno para ${patient.name} guardada localmente.`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la evaluacion.');
    }
  };

  const handleRetake = () => {
    setStep('idle');
    setImagePath(null);
    setRiskResult(null);
    setSaved(false);
  };

  const renderContent = () => {
    switch (step) {
      case 'idle':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.instructionText}>
              Toma una foto del patio o cocina de tu hogar para analizar los factores de riesgo sanitario.
            </Text>
            
            <View style={styles.riskList}>
              <View style={styles.riskItem}><Text>Agua estancada</Text></View>
              <View style={styles.riskItem}><Text>Animales cerca de la cocina</Text></View>
              <View style={styles.riskItem}><Text>Basura acumulada</Text></View>
              <View style={styles.riskItem}><Text>Agua sin proteccion</Text></View>
            </View>

            <View style={styles.modelStatus}>
              <Text style={styles.modelStatusText}>
                {isModelReady ? 'Gemma 4: Listo' : 'Modo simulacion (sin IA)'}
              </Text>
            </View>

            <TouchableOpacity style={styles.captureButton} onPress={showImageSourceOptions}>
              <Ionicons name="camera" size={24} color={COLORS.white} />
              <Text style={styles.captureButtonText}>Seleccionar Imagen</Text>
            </TouchableOpacity>
          </View>
        );

      case 'capturing':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.mockCameraView}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.cameraText}>Preparando imagen...</Text>
              <Text style={styles.cameraSubText}>Asegurate de tener buena iluminacion</Text>
            </View>
          </View>
        );

      case 'analyzing':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.mockCameraView}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.cameraText}>
                {isModelReady ? 'Gemma 4 analizando el entorno...' : 'Simulando analisis...'}
              </Text>
              <Text style={styles.cameraSubText}>Esto puede tomar unos segundos</Text>
            </View>
          </View>
        );

      case 'result':
        if (!riskResult) return null;
        return (
          <View style={styles.contentContainer}>
            <View style={styles.resultContainer}>
              <View style={[
                styles.riskIndicator,
                { backgroundColor: riskAnalyzer.getRiskColor(riskResult.riskLevel) }
              ]}>
                <Text style={styles.riskEmoji}>
                  {riskAnalyzer.getRiskEmoji(riskResult.riskLevel)}
                </Text>
                <Text style={styles.riskLevelText}>
                  {riskAnalyzer.getRiskText(riskResult.riskLevel)}
                </Text>
                <Text style={styles.positiveMessageText}>
                  {riskResult.positiveMessage}
                </Text>
              </View>

              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Revision del entorno:</Text>
                
                <View style={[
                  styles.riskItem,
                  riskResult.risks.stagnantWater.detected ? styles.dangerRisk : styles.safeRisk
                ]}>
                  <Ionicons 
                    name={riskResult.risks.stagnantWater.detected ? 'alert-circle' : 'checkmark-circle'} 
                    size={20} 
                    color={riskResult.risks.stagnantWater.detected ? COLORS.accent : COLORS.secondary} 
                  />
                  <Text style={styles.riskMessage}>{riskResult.risks.stagnantWater.message}</Text>
                </View>

                <View style={[
                  styles.riskItem,
                  riskResult.risks.animalsNearHome.detected ? styles.dangerRisk : styles.safeRisk
                ]}>
                  <Ionicons 
                    name={riskResult.risks.animalsNearHome.detected ? 'alert-circle' : 'checkmark-circle'} 
                    size={20} 
                    color={riskResult.risks.animalsNearHome.detected ? COLORS.accent : COLORS.secondary} 
                  />
                  <Text style={styles.riskMessage}>{riskResult.risks.animalsNearHome.message}</Text>
                </View>

                <View style={[
                  styles.riskItem,
                  riskResult.risks.garbage.detected ? styles.dangerRisk : styles.safeRisk
                ]}>
                  <Ionicons 
                    name={riskResult.risks.garbage.detected ? 'alert-circle' : 'checkmark-circle'} 
                    size={20} 
                    color={riskResult.risks.garbage.detected ? COLORS.accent : COLORS.secondary} 
                  />
                  <Text style={styles.riskMessage}>{riskResult.risks.garbage.message}</Text>
                </View>

                <View style={[
                  styles.riskItem,
                  riskResult.risks.unprotectedWater.detected ? styles.dangerRisk : styles.safeRisk
                ]}>
                  <Ionicons 
                    name={riskResult.risks.unprotectedWater.detected ? 'alert-circle' : 'checkmark-circle'} 
                    size={20} 
                    color={riskResult.risks.unprotectedWater.detected ? COLORS.accent : COLORS.secondary} 
                  />
                  <Text style={styles.riskMessage}>{riskResult.risks.unprotectedWater.message}</Text>
                </View>
              </View>

              <View style={styles.actionPlanContainer}>
                <Text style={styles.actionPlanTitle}>Tu plan de accion:</Text>
                {riskResult.actionPlan.map((action, index) => (
                  <View key={index} style={styles.actionItem}>
                    <Ionicons name="checkbox-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modelUsedContainer}>
                <Text style={styles.modelUsedText}>
                  {isModelReady ? 'Analizado con Gemma 4' : 'Analisis simulado'}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.saveButton, saved && styles.savedButton]}
                  onPress={handleSave}
                  disabled={saved}
                >
                  <Ionicons
                    name={saved ? "checkmark-done-circle" : "save-outline"}
                    size={20}
                    color={COLORS.white}
                  />
                  <Text style={styles.saveButtonText}>
                    {saved ? 'Guardado Local' : 'Guardar Evaluacion'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resetButton} onPress={handleRetake}>
                  <Text style={styles.resetButtonText}>Re-evaluar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Prevencion Ambiental</Text>
        <Text style={styles.sectionDesc}>
          Analiza el entorno del hogar para detectar riesgos de reinfeccion.
        </Text>
        {renderContent()}
      </View>

      <View style={[styles.card, styles.infoCard]}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Como funciona?</Text>
          <Text style={styles.infoText}>
            La IA analiza la imagen y detecta factores de riesgo del entorno.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { padding: 20 },
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  sectionDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 20 },
  contentContainer: { width: '100%' },
  instructionText: { fontSize: 14, color: COLORS.text, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  riskList: { marginBottom: 16 },
  riskItem: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: COLORS.background, borderRadius: 8, marginBottom: 4 },
  modelStatus: { backgroundColor: COLORS.primaryLight, padding: 8, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  modelStatusText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  captureButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  mockCameraView: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: '#F0F5F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  cameraText: { fontSize: 16, fontWeight: '600', color: COLORS.primary, marginTop: 12 },
  cameraSubText: { fontSize: 13, color: COLORS.textMuted, marginTop: 8 },
  resultContainer: { width: '100%' },
  riskIndicator: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  riskEmoji: { fontSize: 48 },
  riskLevelText: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginTop: 8 },
  positiveMessageText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 10,
    opacity: 0.95,
  },
  detailsContainer: { backgroundColor: COLORS.background, borderRadius: 12, padding: 16, marginBottom: 16 },
  detailsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  safeRisk: { backgroundColor: COLORS.secondaryLight, borderWidth: 1, borderColor: COLORS.secondary },
  dangerRisk: { backgroundColor: COLORS.accentLight, borderWidth: 1, borderColor: COLORS.accent },
  riskMessage: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 18 },
  actionPlanContainer: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  actionPlanTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  actionText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 18 },
  modelUsedContainer: { backgroundColor: COLORS.primaryLight, padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  modelUsedText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
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
  savedButton: { backgroundColor: COLORS.textMuted },
  saveButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  resetButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EBF6F8', borderColor: '#BFE1E7', gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  infoText: { fontSize: 12, color: COLORS.primary, lineHeight: 16 },
});