export const COLORS = {
  // Cores principais
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#2DD4BF',
  accent: '#06B6D4',
  accentNeon: '#39FF14',
  neonOrange: '#FF5F1F',

  // Backgrounds Bento Box
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2C2C2C',
  card: '#1E1E1E',
  cardBorder: '#2A2A2A',

  // Texto
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // AQI Colors
  aqiGood: '#39FF14', // Neon Green
  aqiFair: '#A3E635',
  aqiModerate: '#FF5F1F', // Neon Orange
  aqiPoor: '#EF4444',
  aqiVeryPoor: '#991B1B',

  // Gradients
  gradientPrimary: ['#0D9488', '#06B6D4'],
  gradientDanger: ['#DC2626', '#EF4444'],
  gradientDark: ['#121212', '#1E1E1E'],
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
  xxl: 24,
  full: 999,
};

// Map pollutants to Lucide icon names instead of emojis
export const POLLUTANT_INFO: Record<string, { name: string; unit: string; icon: string }> = {
  pm2_5: { name: 'PM2.5', unit: 'µg/m³', icon: 'wind' },
  pm10: { name: 'PM10', unit: 'µg/m³', icon: 'cloud-fog' },
  co: { name: 'CO', unit: 'µg/m³', icon: 'factory' },
  no2: { name: 'NO₂', unit: 'µg/m³', icon: 'car' },
  o3: { name: 'O₃', unit: 'µg/m³', icon: 'sun' },
  so2: { name: 'SO₂', unit: 'µg/m³', icon: 'zap' },
  no: { name: 'NO', unit: 'µg/m³', icon: 'flame' },
  nh3: { name: 'NH₃', unit: 'µg/m³', icon: 'flask-conical' },
};
