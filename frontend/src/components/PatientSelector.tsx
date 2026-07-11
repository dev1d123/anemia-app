/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export interface Patient {
  id: string;
  name: string;
  age: string;
  hb: number;
  weight: string;
  location: string;
  hbStatus: 'Normal' | 'Moderada' | 'Severa';
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Liam Quispe',
    age: '18 meses',
    hb: 9.8,
    weight: '10.5 kg',
    location: 'CC. Huancavelica',
    hbStatus: 'Moderada',
  },
  {
    id: '2',
    name: 'Killa Condori',
    age: '3 años',
    hb: 11.2,
    weight: '14.2 kg',
    location: 'CC. Ayacucho',
    hbStatus: 'Normal',
  },
  {
    id: '3',
    name: 'Thiago Mamani',
    age: '8 meses',
    hb: 8.5,
    weight: '7.8 kg',
    location: 'CC. Puno',
    hbStatus: 'Severa',
  },
];

interface PatientSelectorProps {
  selectedPatient: Patient;
  onSelectPatient: (patient: Patient) => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  selectedPatient,
  onSelectPatient,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getHbBadgeStyle = (status: string) => {
    switch (status) {
      case 'Normal':
        return { bg: COLORS.secondaryLight, text: COLORS.secondary };
      case 'Moderada':
        return { bg: '#FFF3CD', text: '#856404' }; // Amarillo cálido
      case 'Severa':
        return { bg: COLORS.accentLight, text: COLORS.accent };
      default:
        return { bg: COLORS.background, text: COLORS.textMuted };
    }
  };

  const badge = getHbBadgeStyle(selectedPatient.hbStatus);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainSelector}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.leftInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.patientLabel}>Paciente Activo</Text>
            <Text style={styles.patientName}>{selectedPatient.name}</Text>
            <Text style={styles.patientSub}>
              {selectedPatient.age} • {selectedPatient.weight} • {selectedPatient.location}
            </Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
          <View style={[styles.hbBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.hbText, { color: badge.text }]}>
              {selectedPatient.hb} Hb
            </Text>
          </View>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textMuted}
            style={{ marginLeft: 8 }}
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownHeader}>Seleccionar otro paciente:</Text>
          {MOCK_PATIENTS.map((p) => {
            if (p.id === selectedPatient.id) return null;
            const pBadge = getHbBadgeStyle(p.hbStatus);
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.dropdownItem}
                onPress={() => {
                  onSelectPatient(p);
                  setIsOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownLeft}>
                  <Text style={styles.dropdownName}>{p.name}</Text>
                  <Text style={styles.dropdownSub}>
                    {p.age} • {p.weight}
                  </Text>
                </View>
                <View style={[styles.hbBadge, { backgroundColor: pBadge.bg }]}>
                  <Text style={[styles.hbText, { color: pBadge.text }]}>
                    {p.hb} Hb
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 15,
    zIndex: 1000,
  },
  mainSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
  },
  patientSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hbBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hbText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    padding: 12,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginBottom: 6,
  },
  dropdownLeft: {
    flexDirection: 'column',
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dropdownSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
