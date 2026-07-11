import { Request, Response } from 'express';
import { getLatestActiveModelVersion } from '../ia/modelRegistry';
import { detectDrift } from '../ia/driftDetector';

/**
 * Handles incoming synchronization payloads from the mesh network nodes.
 * Validates basic structures and responds with transaction logs.
 */
export const syncData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId, records, timestamp } = req.body;

    if (!nodeId || !records) {
      res.status(400).json({
        success: false,
        error: 'Faltan parámetros obligatorios: nodeId o records.'
      });
      return;
    }

    console.log(`[Sync] Recibidos ${records.length} registros desde el Nodo Mesh: ${nodeId} a las ${timestamp}`);

    // Standard FHIR or Relational mapping would happen here in Phase 4.
    // For Phase 0, we just return a success acknowledgement.
    res.status(200).json({
      success: true,
      syncedRecordsCount: records.length,
      serverTimestamp: new Date().toISOString(),
      recommendedModelVersion: getLatestActiveModelVersion('diagnostico')
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor en sincronización.';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

/**
 * Handles validation of offline predictions against laboratory results to monitor drift.
 */
export const uploadTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelName, telemetryData } = req.body;

    if (!modelName || !telemetryData || !Array.isArray(telemetryData)) {
      res.status(400).json({
        success: false,
        error: 'Se requiere modelName y una lista de registros en telemetryData.'
      });
      return;
    }

    // Process drift logic
    const driftReport = detectDrift(modelName, telemetryData);

    res.status(200).json({
      success: true,
      processedSamples: telemetryData.length,
      driftDetected: driftReport.driftDetected,
      currentF1Score: driftReport.metrics.f1,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor procesando telemetría de IA.';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};
