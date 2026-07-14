import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface HeaderProps {
  onBackPress?: () => void;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onBackPress,
  title,
  subtitle = 'Salud Infantil Rural',
  showBackButton = false,
  userName,
  onLogout,
}) => {
  const displaySubtitle = userName ? `${userName} • ${subtitle}` : subtitle;

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{displaySubtitle}</Text>
        </View>
      </View>
      <View style={styles.rightContainer}>
        <View style={styles.statusContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>LoRa Mesh</Text>
        </View>
        {onLogout && (
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={onLogout} 
            activeOpacity={0.7}
            accessibilityLabel="Cerrar sesión"
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  logoutButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.accentLight,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
