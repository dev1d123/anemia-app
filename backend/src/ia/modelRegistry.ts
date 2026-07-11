export interface AIModel {
  id: string;
  name: string;
  version: string;
  taskType: 'classification' | 'regression' | 'recommendation';
  sizeMB: number;
  isActive: boolean;
  minRAMRequirementGB: number;
  url: string;
}

const REGISTRY: Record<string, AIModel[]> = {
  diagnostico: [
    {
      id: 'diag_conj_mobilenet_v1',
      name: 'Ocular Conjunctiva Image Classifier',
      version: '1.2.0',
      taskType: 'classification',
      sizeMB: 18.4,
      isActive: true,
      minRAMRequirementGB: 1.5,
      url: 'https://models.anemia-app.org/diagnostico/v1.2.0.onnx'
    }
  ],
  nutricion: [
    {
      id: 'nutr_recommender_xgb_v1',
      name: 'Dietary & Supplem. Policy Recommender',
      version: '1.0.1',
      taskType: 'recommendation',
      sizeMB: 2.1,
      isActive: true,
      minRAMRequirementGB: 0.5,
      url: 'https://models.anemia-app.org/nutricion/v1.0.1.json'
    }
  ],
  prevencion: [
    {
      id: 'prev_risk_evaluator_v1',
      name: 'Family Environment Risk Classifier',
      version: '1.0.0',
      taskType: 'classification',
      sizeMB: 0.8,
      isActive: true,
      minRAMRequirementGB: 0.2,
      url: 'https://models.anemia-app.org/prevencion/v1.0.0.json'
    }
  ]
};

/**
 * Gets the latest active model version for a given module.
 */
export const getLatestActiveModelVersion = (moduleName: string): string => {
  const models = REGISTRY[moduleName];
  if (!models) return '0.0.0';
  const active = models.find(m => m.isActive);
  return active ? active.version : '0.0.0';
};

/**
 * Lists all registered models.
 */
export const getModelRegistry = (): Record<string, AIModel[]> => {
  return REGISTRY;
};
