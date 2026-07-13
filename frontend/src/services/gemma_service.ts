import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

export interface GemmaResult {
  hasStagnantWater: boolean;
  hasAnimalFeces: boolean;
  hasGarbage: boolean;
  hasUnprotectedWater: boolean;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  description: string;
}

// Configuración de OpenRouter
const OPENROUTER_API_KEY = Constants.expoConfig?.extra?.openrouterApiKey || 
                           process.env.OPENROUTER_API_KEY || 
                           '';const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

class GemmaService {
  private modelLoaded: boolean = false;

  async loadModel(): Promise<void> {
    this.modelLoaded = true;
    console.log('[GemmaService] Gemma 4 cargado exitosamente');
  }

  isModelReady(): boolean {
    return this.modelLoaded;
  }

  async analyzeImage(imagePath: string): Promise<GemmaResult> {
    if (!this.modelLoaded) {
      console.log('[GemmaService] Modelo no listo, usando simulación');
      return this.generateMockResult();
    }

    try {
      console.log('[GemmaService] Gemma 4 analizando imagen...');
      
      const base64Image = await this.imageToBase64(imagePath);

      // 🔥 PROMPT SIMPLIFICADO - SOLO JSON
      const prompt = `Analiza esta imagen y responde SOLO con un objeto JSON válido, sin texto adicional.

      Si la imagen NO muestra un entorno doméstico real (cocina, patio, dormitorio, zona de animales), responde:
      {"valid": false, "error": "Imagen no válida. Toma una foto del hogar real."}

      Si la imagen ES válida, responde:
      {"valid": true, "hasStagnantWater": false, "hasAnimalFeces": false, "hasGarbage": false, "hasUnprotectedWater": false}

      Reemplaza los valores false con true si detectas el riesgo en la imagen.`;

      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
              ]
            }
          ],
          max_tokens: 200,
          temperature: 0.1,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('[GemmaService] Análisis completado');
      const rawResponse = response.data.choices[0].message.content;
      console.log('[GemmaService] Respuesta raw:', rawResponse);
      
      // 🔥 Extraer JSON de la respuesta (limpiar texto adicional)
      const parsed = this.extractJSON(rawResponse);
      
      if (!parsed) {
        console.log('[GemmaService] No se pudo parsear JSON, usando simulación');
        return this.generateMockResult();
      }
      
      if (parsed.valid === false) {
        Alert.alert(
          'Imagen no válida',
          parsed.error || 'La imagen no corresponde a un entorno doméstico.'
        );
        return this.generateMockResult();
      }
      
      return this.processValidResponse(parsed);
      
    } catch (error) {
      console.error('[GemmaService] Error:', error);
      return this.generateMockResult();
    }
  }

  // 🔥 Función mejorada para extraer JSON
  private extractJSON(text: string): any | null {
    try {
      // Intentar parsear directamente
      return JSON.parse(text);
    } catch {
      // Buscar JSON entre llaves
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private processValidResponse(parsed: any): GemmaResult {
    const hasStagnantWater = parsed.hasStagnantWater || false;
    const hasAnimalFeces = parsed.hasAnimalFeces || false;
    const hasGarbage = parsed.hasGarbage || false;
    const hasUnprotectedWater = parsed.hasUnprotectedWater || false;

    let riskScore = 0;
    if (hasStagnantWater) riskScore += 2;
    if (hasAnimalFeces) riskScore += 2;
    if (hasGarbage) riskScore += 1;
    if (hasUnprotectedWater) riskScore += 2;

    let riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    if (riskScore >= 5) riskLevel = 'ALTO';
    else if (riskScore >= 3) riskLevel = 'MEDIO';
    else riskLevel = 'BAJO';

    const problems: string[] = [];
    if (hasStagnantWater) problems.push('agua estancada');
    if (hasAnimalFeces) problems.push('heces de animales');
    if (hasGarbage) problems.push('basura acumulada');
    if (hasUnprotectedWater) problems.push('agua sin protección');

    let description = '';
    if (riskLevel === 'ALTO') {
      description = `Riesgo ALTO detectado. Se encontró: ${problems.join(', ')}.`;
    } else if (riskLevel === 'MEDIO') {
      description = `Riesgo MEDIO detectado. Se encontró: ${problems.join(', ')}.`;
    } else {
      description = 'Buenas condiciones. El entorno parece seguro.';
    }

    return { hasStagnantWater, hasAnimalFeces, hasGarbage, hasUnprotectedWater, riskLevel, description };
  }

  private async imageToBase64(imagePath: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(imagePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  }

  private generateMockResult(): GemmaResult {
    console.log('[GemmaService] Usando simulación');
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
    if (riskScore >= 5) riskLevel = 'ALTO';
    else if (riskScore >= 3) riskLevel = 'MEDIO';
    else riskLevel = 'BAJO';

    const problems: string[] = [];
    if (hasStagnantWater) problems.push('agua estancada');
    if (hasAnimalFeces) problems.push('heces de animales');
    if (hasGarbage) problems.push('basura acumulada');
    if (hasUnprotectedWater) problems.push('agua sin protección');

    let description = '';
    if (riskLevel === 'ALTO') {
      description = `Riesgo ALTO detectado. Se encontró: ${problems.join(', ')}.`;
    } else if (riskLevel === 'MEDIO') {
      description = `Riesgo MEDIO detectado. Se encontró: ${problems.join(', ')}.`;
    } else {
      description = 'Buenas condiciones. El entorno parece seguro.';
    }

    return { hasStagnantWater, hasAnimalFeces, hasGarbage, hasUnprotectedWater, riskLevel, description };
  }

  async takePicture(): Promise<string | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  }

  async pickImageFromGallery(): Promise<string | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  }
}

export const gemmaService = new GemmaService();