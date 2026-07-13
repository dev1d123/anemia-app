import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnvironmentRisk, createEnvironmentRisk } from '../models/environment_risk';

const STORAGE_KEY = 'environment_risks';

class StorageService {
  async saveRiskAssessment(risk: EnvironmentRisk): Promise<void> {
    try {
      const risks = await this.getAllRisks();
      risks.push(risk);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      throw error;
    }
  }

  async getUnsyncedRisks(): Promise<EnvironmentRisk[]> {
    try {
      const allRisks = await this.getAllRisks();
      return allRisks.filter(risk => !risk.synced);
    } catch (error) {
      console.error('Error getting unsynced risks:', error);
      return [];
    }
  }

  async getRisksForPatient(patientId: string): Promise<EnvironmentRisk[]> {
    try {
      const allRisks = await this.getAllRisks();
      return allRisks
        .filter(risk => risk.patientId === patientId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting risks for patient:', error);
      return [];
    }
  }

  async markAsSynced(id: string): Promise<void> {
    try {
      const risks = await this.getAllRisks();
      const updatedRisks = risks.map(risk => 
        risk.id === id ? { ...risk, synced: true } : risk
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRisks));
    } catch (error) {
      console.error('Error marking as synced:', error);
      throw error;
    }
  }

  async deleteRisk(id: string): Promise<void> {
    try {
      const risks = await this.getAllRisks();
      const filteredRisks = risks.filter(risk => risk.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRisks));
    } catch (error) {
      console.error('Error deleting risk:', error);
      throw error;
    }
  }

  async getAllRisks(): Promise<EnvironmentRisk[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => createEnvironmentRisk(item));
    } catch (error) {
      console.error('Error getting all risks:', error);
      return [];
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export const storageService = new StorageService();