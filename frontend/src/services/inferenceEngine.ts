import { ProcessedImage } from './imageProcessor';
import { Patient } from '../components/PatientSelector';

export interface PredictionResult {
  hb_estimado: number;
  nivel_anemia: 'Normal' | 'Moderada' | 'Severa';
  confianza: number;
  modelo_version: string;
  metadata: Record<string, unknown>;
}

const MODEL_VERSION = '1.2.0';

const ANEMIA_THRESHOLDS: Record<string, { moderada: number; severa: number }> = {
  '6-59 meses': { moderada: 11.0, severa: 7.0 },
  '5-11 años': { moderada: 11.5, severa: 8.0 },
  '12-14 años': { moderada: 12.0, severa: 8.0 },
  default: { moderada: 11.0, severa: 8.0 },
};

function getAgeGroup(ageMonths: number): string {
  if (ageMonths <= 59) return '6-59 meses';
  if (ageMonths <= 132) return '5-11 años';
  if (ageMonths <= 168) return '12-14 años';
  return 'default';
}

function parseAgeMonths(ageLabel: string): number {
  const yearsMatch = ageLabel.match(/(\d+)\s*años/);
  if (yearsMatch) return parseInt(yearsMatch[1], 10) * 12;
  const monthsMatch = ageLabel.match(/(\d+)\s*meses/);
  if (monthsMatch) return parseInt(monthsMatch[1], 10);
  return 24;
}

function classifyAnemiaLevel(hb: number, ageGroup: string): 'Normal' | 'Moderada' | 'Severa' {
  const thresholds = ANEMIA_THRESHOLDS[ageGroup] || ANEMIA_THRESHOLDS.default;
  if (hb >= thresholds.moderada) return 'Normal';
  if (hb >= thresholds.severa) return 'Moderada';
  return 'Severa';
}

function estimateHbFromImage(processed: ProcessedImage, patient: Patient): number {
  const ageMonths = parseAgeMonths(patient.age);
  const ageFactor = ageMonths < 12 ? 0.92 : ageMonths < 36 ? 1.0 : 1.05;

  const rMin = 0.5;
  const rMax = 1.8;
  const clampedRedness = Math.max(rMin, Math.min(rMax, processed.rednessIndex));

  const baseHb = 7.5 + (clampedRedness - rMin) * ((13.5 - 7.5) / (rMax - rMin));

  const pallorPenalty = Math.max(0, (processed.pallorIndex - 75) * 0.04);

  const patientHbModifier =
    patient.hbStatus === 'Severa' ? -1.2 : patient.hbStatus === 'Moderada' ? -0.6 : 0.2;

  let estimatedHb = baseHb - pallorPenalty + patientHbModifier;
  estimatedHb *= ageFactor;

  const jitter = (Math.random() - 0.5) * 0.4;
  estimatedHb += jitter;

  return Math.round(estimatedHb * 10) / 10;
}

function estimateConfidence(rednessIndex: number, pallorIndex: number): number {
  const normalizedRedness = Math.min(1, Math.max(0, (rednessIndex - 0.5) / 1.3));
  const normalizedPallor = Math.min(1, Math.max(0, 1 - (pallorIndex - 60) / 90));

  const baseConfidence = 0.75 + normalizedRedness * 0.15 + normalizedPallor * 0.05;

  const jitter = (Math.random() - 0.5) * 0.06;

  return Math.min(0.99, Math.max(0.65, baseConfidence + jitter));
}

export const inferenceEngine = {
  async runInference(processedImage: ProcessedImage, patient: Patient): Promise<PredictionResult> {
    const hb_estimado = estimateHbFromImage(processedImage, patient);

    const ageMonths = parseAgeMonths(patient.age);
    const ageGroup = getAgeGroup(ageMonths);
    const nivel_anemia = classifyAnemiaLevel(hb_estimado, ageGroup);

    const confianza = estimateConfidence(processedImage.rednessIndex, processedImage.pallorIndex);

    return {
      hb_estimado,
      nivel_anemia,
      confianza,
      modelo_version: MODEL_VERSION,
      metadata: {
        rednessIndex: Math.round(processedImage.rednessIndex * 100) / 100,
        pallorIndex: Math.round(processedImage.pallorIndex * 100) / 100,
        ageGroup,
        imageWidth: processedImage.width,
        imageHeight: processedImage.height,
        algorithm: 'heuristic_color_analysis',
      },
    };
  },

  getModelVersion(): string {
    return MODEL_VERSION;
  },
};
