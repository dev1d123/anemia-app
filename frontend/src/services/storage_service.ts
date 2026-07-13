import * as SQLite from 'expo-sqlite';
import { EnvironmentRisk, createEnvironmentRisk } from '../models/environment_risk';

// Abrir base de datos
const db = SQLite.openDatabaseSync('anemia.db');

class StorageService {
  // Inicializar base de datos (crear tabla si no existe)
  async initDatabase(): Promise<void> {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS environment_risks (
          id TEXT PRIMARY KEY,
          patientId TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          imagePath TEXT,
          hasStagnantWater INTEGER DEFAULT 0,
          hasAnimalFeces INTEGER DEFAULT 0,
          hasGarbage INTEGER DEFAULT 0,
          hasUnprotectedWater INTEGER DEFAULT 0,
          riskLevel TEXT NOT NULL,
          recommendations TEXT,
          synced INTEGER DEFAULT 0
        );
      `);
      console.log('[StorageService] Base de datos inicializada');
    } catch (error) {
      console.error('[StorageService] Error inicializando DB:', error);
      throw error;
    }
  }

  // Guardar evaluación
  async saveRiskAssessment(risk: EnvironmentRisk): Promise<void> {
    try {
      await this.initDatabase();
      
      const recommendationsStr = risk.recommendations.join('|');
      
      await db.runAsync(
        `INSERT OR REPLACE INTO environment_risks (
          id, patientId, timestamp, imagePath,
          hasStagnantWater, hasAnimalFeces, hasGarbage, hasUnprotectedWater,
          riskLevel, recommendations, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          risk.id,
          risk.patientId,
          risk.timestamp,
          risk.imagePath || '',
          risk.hasStagnantWater ? 1 : 0,
          risk.hasAnimalFeces ? 1 : 0,
          risk.hasGarbage ? 1 : 0,
          risk.hasUnprotectedWater ? 1 : 0,
          risk.riskLevel,
          recommendationsStr,
          risk.synced ? 1 : 0,
        ]
      );
      
      console.log('[StorageService] Evaluación guardada:', risk.id);
    } catch (error) {
      console.error('[StorageService] Error guardando:', error);
      throw error;
    }
  }

  // Obtener todas las evaluaciones no sincronizadas
  async getUnsyncedRisks(): Promise<EnvironmentRisk[]> {
    try {
      await this.initDatabase();
      const result = await db.getAllAsync(
        'SELECT * FROM environment_risks WHERE synced = 0 ORDER BY timestamp ASC'
      );
      return result.map((row: any) => this.rowToRisk(row));
    } catch (error) {
      console.error('[StorageService] Error obteniendo no sincronizadas:', error);
      return [];
    }
  }

  // Obtener evaluaciones de un paciente
  async getRisksForPatient(patientId: string): Promise<EnvironmentRisk[]> {
    try {
      await this.initDatabase();
      const result = await db.getAllAsync(
        'SELECT * FROM environment_risks WHERE patientId = ? ORDER BY timestamp DESC',
        [patientId]
      );
      return result.map((row: any) => this.rowToRisk(row));
    } catch (error) {
      console.error('[StorageService] Error obteniendo por paciente:', error);
      return [];
    }
  }

  // Marcar como sincronizado
  async markAsSynced(id: string): Promise<void> {
    try {
      await this.initDatabase();
      await db.runAsync(
        'UPDATE environment_risks SET synced = 1 WHERE id = ?',
        [id]
      );
      console.log('[StorageService] Marcado como sincronizado:', id);
    } catch (error) {
      console.error('[StorageService] Error marcando como sincronizado:', error);
      throw error;
    }
  }

  // Eliminar evaluación
  async deleteRisk(id: string): Promise<void> {
    try {
      await this.initDatabase();
      await db.runAsync(
        'DELETE FROM environment_risks WHERE id = ?',
        [id]
      );
      console.log('[StorageService] Eliminado:', id);
    } catch (error) {
      console.error('[StorageService] Error eliminando:', error);
      throw error;
    }
  }

  // Obtener todas las evaluaciones
  async getAllRisks(): Promise<EnvironmentRisk[]> {
    try {
      await this.initDatabase();
      const result = await db.getAllAsync(
        'SELECT * FROM environment_risks ORDER BY timestamp DESC'
      );
      return result.map((row: any) => this.rowToRisk(row));
    } catch (error) {
      console.error('[StorageService] Error obteniendo todas:', error);
      return [];
    }
  }

  // Contar evaluaciones pendientes
  async getPendingCount(): Promise<number> {
    try {
      await this.initDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM environment_risks WHERE synced = 0'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('[StorageService] Error contando pendientes:', error);
      return 0;
    }
  }

  // Limpiar todos los datos
  async clearAll(): Promise<void> {
    try {
      await this.initDatabase();
      await db.runAsync('DELETE FROM environment_risks');
      console.log('[StorageService] Todos los datos eliminados');
    } catch (error) {
      console.error('[StorageService] Error limpiando:', error);
      throw error;
    }
  }

  // Convertir fila a objeto EnvironmentRisk
  private rowToRisk(row: any): EnvironmentRisk {
    return {
      id: row.id,
      patientId: row.patientId,
      timestamp: row.timestamp,
      imagePath: row.imagePath || '',
      hasStagnantWater: row.hasStagnantWater === 1,
      hasAnimalFeces: row.hasAnimalFeces === 1,
      hasGarbage: row.hasGarbage === 1,
      hasUnprotectedWater: row.hasUnprotectedWater === 1,
      riskLevel: row.riskLevel,
      recommendations: row.recommendations ? row.recommendations.split('|') : [],
      synced: row.synced === 1,
    };
  }
}

export const storageService = new StorageService();