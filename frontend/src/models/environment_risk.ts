export interface EnvironmentRisk {
  id: string;
  patientId: string;
  timestamp: string;
  imagePath: string;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  positiveMessage: string;
  risks: {
    stagnantWater: {
      detected: boolean;
      message: string;
    };
    animalsNearHome: {
      detected: boolean;
      message: string;
    };
    garbage: {
      detected: boolean;
      message: string;
    };
    unprotectedWater: {
      detected: boolean;
      message: string;
    };
  };
  actionPlan: string[];
  recommendations: string[];
  synced: boolean;
}

export const createEnvironmentRisk = (data: Partial<EnvironmentRisk>): EnvironmentRisk => {
  const defaultRiskMessages = {
    stagnantWater: { detected: false, message: 'No hay agua estancada.' },
    animalsNearHome: { detected: false, message: 'Los animales estan lejos.' },
    garbage: { detected: false, message: 'El area esta limpia.' },
    unprotectedWater: { detected: false, message: 'El agua esta protegida.' },
  };

  return {
    id: data.id || Date.now().toString(),
    patientId: data.patientId || '',
    timestamp: data.timestamp || new Date().toISOString(),
    imagePath: data.imagePath || '',
    riskLevel: data.riskLevel || 'BAJO',
    positiveMessage: data.positiveMessage || 'Tu hogar esta en buenas condiciones.',
    risks: {
      stagnantWater: data.risks?.stagnantWater || defaultRiskMessages.stagnantWater,
      animalsNearHome: data.risks?.animalsNearHome || defaultRiskMessages.animalsNearHome,
      garbage: data.risks?.garbage || defaultRiskMessages.garbage,
      unprotectedWater: data.risks?.unprotectedWater || defaultRiskMessages.unprotectedWater,
    },
    actionPlan: data.actionPlan || ['Mantén el patio limpio cada semana'],
    recommendations: data.recommendations || [],
    synced: data.synced || false,
  };
};

export const toJson = (risk: EnvironmentRisk): Record<string, any> => {
  return {
    id: risk.id,
    patientId: risk.patientId,
    timestamp: risk.timestamp,
    riskLevel: risk.riskLevel,
    positiveMessage: risk.positiveMessage,
    risks: risk.risks,
    actionPlan: risk.actionPlan,
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