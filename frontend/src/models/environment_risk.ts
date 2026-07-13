export interface EnvironmentRisk {
  id: string;
  patientId: string;
  timestamp: string;
  imagePath: string;
  hasStagnantWater: boolean;
  hasAnimalFeces: boolean;
  hasGarbage: boolean;
  hasUnprotectedWater: boolean;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  recommendations: string[];
  synced: boolean;
}

export const createEnvironmentRisk = (data: Partial<EnvironmentRisk>): EnvironmentRisk => {
  return {
    id: data.id || Date.now().toString(),
    patientId: data.patientId || '',
    timestamp: data.timestamp || new Date().toISOString(),
    imagePath: data.imagePath || '',
    hasStagnantWater: data.hasStagnantWater || false,
    hasAnimalFeces: data.hasAnimalFeces || false,
    hasGarbage: data.hasGarbage || false,
    hasUnprotectedWater: data.hasUnprotectedWater || false,
    riskLevel: data.riskLevel || 'BAJO',
    recommendations: data.recommendations || [],
    synced: data.synced || false,
  };
};

export const toJson = (risk: EnvironmentRisk): Record<string, any> => {
  return {
    id: risk.id,
    patientId: risk.patientId,
    timestamp: risk.timestamp,
    hasStagnantWater: risk.hasStagnantWater,
    hasAnimalFeces: risk.hasAnimalFeces,
    hasGarbage: risk.hasGarbage,
    hasUnprotectedWater: risk.hasUnprotectedWater,
    riskLevel: risk.riskLevel,
    recommendations: risk.recommendations,
  };
};

export const getRecommendations = (
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO',
  risks: {
    hasStagnantWater: boolean;
    hasAnimalFeces: boolean;
    hasGarbage: boolean;
    hasUnprotectedWater: boolean;
  }
): string[] => {
  const recommendations: string[] = [];

  if (riskLevel === 'ALTO') {
    recommendations.push(
      'Hervir el agua antes de consumirla',
      'Mantener a los animales lejos de la cocina y area de juego',
      'Enterrar o quemar la basura lejos de la casa',
      'Lavarse las manos con agua y jabon antes de comer',
      'Cubrir el pozo o recipiente de agua con una tapa'
    );
  } else if (riskLevel === 'MEDIO') {
    recommendations.push(
      'Tapar bien los recipientes de agua',
      'Lavarse las manos antes de comer',
      'No acumular basura cerca de la casa'
    );
  } else {
    recommendations.push(
      'Buen trabajo, sigue manteniendo el entorno limpio',
      'Recuerda lavar las manos frecuentemente'
    );
  }

  if (risks.hasStagnantWater) {
    recommendations.push('Eliminar el agua estancada para evitar mosquitos');
  }
  if (risks.hasAnimalFeces) {
    recommendations.push('Limpiar las heces de animales y mantenerlos lejos');
  }
  if (risks.hasGarbage) {
    recommendations.push('Eliminar la basura acumulada');
  }
  if (risks.hasUnprotectedWater) {
    recommendations.push('Proteger la fuente de agua con una tapa');
  }

  return [...new Set(recommendations)];
};