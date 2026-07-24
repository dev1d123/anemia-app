import { EnvironmentRisk, createEnvironmentRisk } from '../models/environment_risk';
import { GemmaResult } from './gemma_service';

class RiskAnalyzer {
  analyzeRisks(params: {
    patientId: string;
    imagePath: string;
    gemmaResult: GemmaResult;
  }): EnvironmentRisk {
    const { patientId, imagePath, gemmaResult } = params;

    const recommendations = [...gemmaResult.actionPlan];

    return createEnvironmentRisk({
      patientId,
      imagePath,
      riskLevel: gemmaResult.riskLevel,
      positiveMessage: gemmaResult.positiveMessage,
      risks: gemmaResult.risks,
      actionPlan: gemmaResult.actionPlan,
      recommendations,
      synced: false,
    });
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'BAJO': return '#2A9D8F';
      case 'MEDIO': return '#F57C00';
      case 'ALTO': return '#D32F2F';
      default: return '#6C757D';
    }
  }

  getRiskEmoji(riskLevel: string): string {
    switch (riskLevel) {
      case 'BAJO': return '🟢';
      case 'MEDIO': return '🟡';
      case 'ALTO': return '🔴';
      default: return '⬜';
    }
  }

  getRiskText(riskLevel: string): string {
    switch (riskLevel) {
      case 'BAJO': return 'Riesgo Bajo - Entorno seguro';
      case 'MEDIO': return 'Riesgo Medio - Tome precauciones';
      case 'ALTO': return 'Riesgo Alto - Actue ahora';
      default: return 'Riesgo desconocido';
    }
  }
}

export const riskAnalyzer = new RiskAnalyzer();