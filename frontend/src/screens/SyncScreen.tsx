import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export const SyncScreen: React.FC = () => {
  const [syncState, setSyncState] = useState<'idle' | 'connecting' | 'transmitting' | 'done'>('idle');
  const [queueCount, setQueueCount] = useState(3);
  const [log, setLog] = useState<string[]>([]);

  const handleStartSync = () => {
    setSyncState('connecting');
    setLog(['Iniciando protocolo de transmisión LoRa Mesh...', 'Buscando Nodo Base Rural más cercano...']);

    setTimeout(() => {
      setSyncState('transmitting');
      setLog((prev) => [...prev, 'Conectado a Nodo "Pampa Blanca A" (SF7, RSSI: -96dBm).', 'Transmitiendo cola de datos (3 registros)...']);

      setTimeout(() => {
        setLog((prev) => [...prev, 'Enviando Diagnóstico Ocular - Liam Quispe (OK)', 'Enviando Encuesta Ambiental (OK)', 'Enviando Reporte de Suplementación (OK)', 'Esperando ACK de confirmación...']);

        setTimeout(() => {
          setSyncState('done');
          setQueueCount(0);
          setLog((prev) => [...prev, 'ACK recibido con éxito. Registros transformados a formato FHIR.', 'Sincronización completada con éxito.']);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const handleReset = () => {
    setSyncState('idle');
    setQueueCount(3);
    setLog([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Estado del Nodo Mesh */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sincronización Red LoRa Mesh</Text>
        <Text style={styles.sectionDesc}>
          Permite transmitir historiales clínicos y diagnósticos sin acceso a internet utilizando la red mesh de radiofrecuencia rural.
        </Text>

        <View style={styles.statusRow}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Cola Local</Text>
            <Text style={[styles.statusValue, { color: queueCount > 0 ? COLORS.accent : COLORS.secondary }]}>
              {queueCount} registros
            </Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Canal LoRa</Text>
            <Text style={[styles.statusValue, { color: COLORS.primary }]}>915 MHz</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.antennaBox}>
          <Ionicons name="radio-outline" size={24} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.antennaTitle}>Nodo Base: Pampa Blanca A</Text>
            <Text style={styles.antennaSub}>Distancia: ~1.4 km • Señal: Excelente (-96 dBm)</Text>
          </View>
          <View style={styles.signalBarRow}>
            <View style={[styles.signalBar, styles.activeBar, { height: 6 }]} />
            <View style={[styles.signalBar, styles.activeBar, { height: 10 }]} />
            <View style={[styles.signalBar, styles.activeBar, { height: 14 }]} />
            <View style={[styles.signalBar, styles.inactiveBar, { height: 18 }]} />
          </View>
        </View>
      </View>

      {/* Panel de Control */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Panel de Transmisión</Text>
        {syncState === 'idle' && (
          <TouchableOpacity
            style={[styles.syncBtn, queueCount === 0 && styles.disabledBtn]}
            onPress={handleStartSync}
            disabled={queueCount === 0}
          >
            <Ionicons name="sync" size={20} color={COLORS.white} />
            <Text style={styles.syncBtnText}>Iniciar Sincronización Offline</Text>
          </TouchableOpacity>
        )}

        {(syncState === 'connecting' || syncState === 'transmitting') && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>
              {syncState === 'connecting' ? 'Estableciendo enlace LoRa...' : 'Transmitiendo datos por radio...'}
            </Text>
          </View>
        )}

        {syncState === 'done' && (
          <View style={styles.doneContainer}>
            <Ionicons name="checkmark-done-circle" size={48} color={COLORS.secondary} />
            <Text style={styles.doneText}>¡Sincronización Exitosa!</Text>
            <Text style={styles.doneSub}>Los datos locales fueron recibidos por la estación base y borrados de la cola de salida.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Simular nueva cola</Text>
            </TouchableOpacity>
          </View>
        )}

        {log.length > 0 && (
          <View style={styles.logBox}>
            <Text style={styles.logHeader}>Terminal de Transmisión:</Text>
            {log.map((item, index) => (
              <Text key={index} style={styles.logLine}>
                &gt; {item}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statusBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  antennaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 14,
  },
  antennaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  antennaSub: {
    fontSize: 11,
    color: COLORS.text,
    marginTop: 2,
  },
  signalBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 10,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
  },
  activeBar: {
    backgroundColor: COLORS.primary,
  },
  inactiveBar: {
    backgroundColor: COLORS.border,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
  },
  syncBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loaderText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  doneContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  doneText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 8,
    marginBottom: 6,
  },
  doneSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  resetBtnText: {
    color: COLORS.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  logBox: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
  },
  logHeader: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  logLine: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 14,
  },
});
