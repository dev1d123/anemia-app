import * as ImagePicker from 'expo-image-picker';

export interface GemmaResult {
  hasStagnantWater: boolean;
  hasAnimalFeces: boolean;
  hasGarbage: boolean;
  hasUnprotectedWater: boolean;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  description: string;
}

class GemmaService {
  private modelLoaded: boolean = false;

  // Cargar modelo Gemma 4
  async loadModel(): Promise<void> {
    try {
      // En produccion: cargar modelo real desde assets
      this.modelLoaded = true;
      console.log('[GemmaService] Modelo cargado exitosamente');
    } catch (error) {
      console.log('[GemmaService] Modo simulacion activado');
      this.modelLoaded = false;
    }
  }

  isModelReady(): boolean {
    return this.modelLoaded;
  }

  // Analizar imagen con Gemma 4
  async analyzeImage(imagePath: string): Promise<GemmaResult> {
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (this.modelLoaded) {
      // En produccion: aqui iria la llamada real a Gemma 4
      return this.generateMockResult();
    }

    return this.generateMockResult();
  }

  private generateMockResult(): GemmaResult {
    const random = Date.now() % 10;

    const hasStagnantWater = random % 3 === 0;
    const hasAnimalFeces = random % 4 === 0;
    const hasGarbage = random % 5 === 0;
    const hasUnprotectedWater = random % 3 === 1;

    let riskScore = 0;
    if (hasStagnantWater) riskScore += 2;
    if (hasAnimalFeces) riskScore += 2;
    if (hasGarbage) riskScore += 1;
    if (hasUnprotectedWater) riskScore += 2;

    let riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    if (riskScore >= 5) {
      riskLevel = 'ALTO';
    } else if (riskScore >= 3) {
      riskLevel = 'MEDIO';
    } else {
      riskLevel = 'BAJO';
    }

    const problems: string[] = [];
    if (hasStagnantWater) problems.push('agua estancada');
    if (hasAnimalFeces) problems.push('heces de animales');
    if (hasGarbage) problems.push('basura acumulada');
    if (hasUnprotectedWater) problems.push('agua sin proteccion');

    let description = '';
    if (riskLevel === 'ALTO') {
      description = `Riesgo ALTO detectado. Se encontro: ${problems.join(', ')}. Esto representa un peligro significativo para la salud del nino.`;
    } else if (riskLevel === 'MEDIO') {
      description = `Riesgo MEDIO detectado. Se encontro: ${problems.join(', ')}. Es importante tomar medidas preventivas.`;
    } else {
      description = 'Buenas condiciones. El entorno parece seguro. Continua con las buenas practicas de higiene.';
    }

    return {
      hasStagnantWater,
      hasAnimalFeces,
      hasGarbage,
      hasUnprotectedWater,
      riskLevel,
      description,
    };
  }

  // Tomar foto con camara (usando expo-image-picker)
  async takePicture(): Promise<string | null> {
    try {
      // Solicitar permisos de camara
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        console.log('Permiso de camara denegado');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  // Seleccionar imagen de galeria (usando expo-image-picker)
  async pickImageFromGallery(): Promise<string | null> {
    try {
      // Solicitar permisos de galeria
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        console.log('Permiso de galeria denegado');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  }
}

export const gemmaService = new GemmaService();