import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ProcessedImage {
  originalUri: string;
  savedLocalPath: string;
  width: number;
  height: number;
  rednessIndex: number;
  pallorIndex: number;
  preprocessedForModel: string;
}

const DIAGNOSTIC_IMAGES_DIR = `${FileSystem.documentDirectory}diagnostic_images/`;

async function ensureDirectoryExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(DIAGNOSTIC_IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DIAGNOSTIC_IMAGES_DIR, { intermediates: true });
  }
}

async function saveOriginalImage(uri: string, pacienteId: string): Promise<string> {
  await ensureDirectoryExists();
  const timestamp = Date.now();
  const filename = `diag_${pacienteId}_${timestamp}.jpg`;
  const destPath = `${DIAGNOSTIC_IMAGES_DIR}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: destPath });
  return destPath;
}

function computeRednessIndex(hexColors: string[]): number {
  const redSum = hexColors.reduce((sum, hex) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (g + b === 0) return sum + r;
    return sum + r / ((g + b) / 2);
  }, 0);
  return redSum / hexColors.length;
}

function computePallorIndex(hexColors: string[]): number {
  const paleSum = hexColors.reduce((sum, hex) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return sum + (r + g + b) / 3;
  }, 0);
  return paleSum / hexColors.length;
}

function sampleImageColors(base64: string): string[] {
  const hexSample: string[] = [];
  for (let i = 0; i < base64.length - 6; i += 600) {
    const r = base64.charCodeAt(i % base64.length) % 256;
    const g = base64.charCodeAt((i + 2) % base64.length) % 256;
    const b = base64.charCodeAt((i + 4) % base64.length) % 256;
    const hex = [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    hexSample.push(hex);
    if (hexSample.length >= 10) break;
  }
  return hexSample;
}

export const imageProcessor = {
  async processCapture(capturedUri: string, pacienteId: string): Promise<ProcessedImage> {
    const savedPath = await saveOriginalImage(capturedUri, pacienteId);

    const resized = await ImageManipulator.manipulateAsync(
      capturedUri,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    const colorSample = sampleImageColors(resized.base64 ?? '');

    const rednessIndex = computeRednessIndex(colorSample);
    const pallorIndex = computePallorIndex(colorSample);

    return {
      originalUri: capturedUri,
      savedLocalPath: savedPath,
      width: resized.width,
      height: resized.height,
      rednessIndex,
      pallorIndex,
      preprocessedForModel: savedPath,
    };
  },

  async deleteImage(localPath: string): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      }
    } catch (error) {
      console.error('[ImageProcessor] Error al eliminar imagen:', error);
    }
  },
};
