// verify_data.js
// Para ejecutar: node verify_data.js

// Configurar el entorno para Expo
require('expo/register');

// Importar el servicio usando la ruta absoluta
const path = require('path');
const { storageService } = require('./src/services/storage_service');

async function verificarDatos() {
  try {
    console.log('========== VERIFICACION DE DATOS GUARDADOS ==========');
    
    const allRisks = await storageService.getAllRisks();
    const pendingCount = await storageService.getPendingCount();
    
    console.log(`\nTotal de registros: ${allRisks.length}`);
    console.log(`Pendientes de sincronizar: ${pendingCount}`);
    
    if (allRisks.length === 0) {
      console.log('\nNo hay registros guardados en la base de datos.');
      return;
    }
    
    allRisks.forEach((risk, index) => {
      console.log(`\n--- Registro ${index + 1} ---`);
      console.log(`ID: ${risk.id}`);
      console.log(`Paciente ID: ${risk.patientId}`);
      console.log(`Fecha: ${risk.timestamp}`);
      console.log(`Nivel de riesgo: ${risk.riskLevel}`);
      console.log(`Agua estancada: ${risk.hasStagnantWater}`);
      console.log(`Heces de animales: ${risk.hasAnimalFeces}`);
      console.log(`Basura acumulada: ${risk.hasGarbage}`);
      console.log(`Agua sin proteccion: ${risk.hasUnprotectedWater}`);
      console.log(`Recomendaciones: ${risk.recommendations.join(', ')}`);
      console.log(`Sincronizado: ${risk.synced}`);
      console.log(`Ruta de imagen: ${risk.imagePath || 'No disponible'}`);
    });
    
    console.log('\n=========================================');
    console.log('Verificacion completada.');
    
  } catch (error) {
    console.error('Error al verificar datos:', error);
  }
}

// Ejecutar
verificarDatos();