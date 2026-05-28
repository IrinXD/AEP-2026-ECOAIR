export const COLORS = {
  // Cores principais
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#14B8A6',
  accent: '#06B6D4',

  // Backgrounds
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  card: '#1E293B',
  cardBorder: '#334155',

  // Texto
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // AQI Colors
  aqiGood: '#22C55E',
  aqiFair: '#84CC16',
  aqiModerate: '#F59E0B',
  aqiPoor: '#EF4444',
  aqiVeryPoor: '#991B1B',

  // Gradients (start, end)
  gradientPrimary: ['#0D9488', '#06B6D4'],
  gradientDanger: ['#DC2626', '#EF4444'],
  gradientDark: ['#0F172A', '#1E293B'],
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    hero: 48,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// Pollutant display info
export const POLLUTANT_INFO: Record<string, { name: string; unit: string; icon: string }> = {
  pm2_5: { name: 'PM2.5', unit: 'µg/m³', icon: '🔬' },
  pm10: { name: 'PM10', unit: 'µg/m³', icon: '💨' },
  co: { name: 'CO', unit: 'µg/m³', icon: '🏭' },
  no2: { name: 'NO₂', unit: 'µg/m³', icon: '🚗' },
  o3: { name: 'O₃', unit: 'µg/m³', icon: '☀️' },
  so2: { name: 'SO₂', unit: 'µg/m³', icon: '⚡' },
  no: { name: 'NO', unit: 'µg/m³', icon: '🔥' },
  nh3: { name: 'NH₃', unit: 'µg/m³', icon: '🧪' },
};
