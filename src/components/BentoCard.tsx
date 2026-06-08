import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../utils/constants';

interface BentoCardProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  value?: string | number;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  highlightColor?: string;
}

export function BentoCard({
  title,
  icon: Icon,
  iconColor = COLORS.primary,
  value,
  subtitle,
  children,
  style,
  highlightColor,
}: BentoCardProps) {
  return (
    <View style={[styles.container, style]}>
      {highlightColor && (
        <View style={[styles.highlight, { backgroundColor: highlightColor }]} />
      )}
      
      <View style={styles.header}>
        {Icon && <Icon size={20} color={iconColor} style={styles.icon} />}
        <Text style={styles.title}>{title}</Text>
      </View>

      {value !== undefined && (
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}

      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueContainer: {
    marginTop: SPACING.xs,
  },
  value: {
    color: COLORS.text,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  content: {
    marginTop: SPACING.sm,
    flex: 1,
  },
});
