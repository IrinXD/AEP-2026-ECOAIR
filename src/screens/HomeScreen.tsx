import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchAirPollution,
  getAqiLabel,
  AirPollutionData,
  DEFAULT_LOCATION,
} from '../services/api';
import { analyzeRisk, RiskAnalysis } from '../utils/aiLogic';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, POLLUTANT_INFO } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [pollutionData, setPollutionData] = useState<AirPollutionData | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAirPollution();
      setPollutionData(data);

      const risk = analyzeRisk(data.aqi, data.components);
      setRiskAnalysis(risk);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      setError('Não foi possível carregar os dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    loadData();
  }, [loadData, fadeAnim, scaleAnim]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analisando qualidade do ar...</Text>
        <Text style={styles.loadingSubtext}>Conectando à estação de {DEFAULT_LOCATION.name}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-offline" size={64} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const aqiInfo = pollutionData ? getAqiLabel(pollutionData.aqi) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>EcoAir</Text>
          <Text style={styles.headerSubtitle}>Monitoramento Inteligente</Text>
        </View>
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.locationText}>{DEFAULT_LOCATION.name}</Text>
        </View>
      </View>

      {/* AQI Card Principal */}
      {pollutionData && aqiInfo && (
        <Animated.View
          style={[
            styles.aqiCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              borderLeftColor: aqiInfo.color,
            },
          ]}
        >
          <View style={styles.aqiCardHeader}>
            <Text style={styles.aqiCardTitle}>Índice de Qualidade do Ar</Text>
            <View style={[styles.aqiBadge, { backgroundColor: aqiInfo.color + '20' }]}>
              <Text style={[styles.aqiBadgeText, { color: aqiInfo.color }]}>
                AQI {pollutionData.aqi}
              </Text>
            </View>
          </View>

          <View style={styles.aqiMainRow}>
            <View style={styles.aqiNumberContainer}>
              <Text style={[styles.aqiNumber, { color: aqiInfo.color }]}>
                {pollutionData.aqi}
              </Text>
              <Text style={styles.aqiScale}>/5</Text>
            </View>
            <View style={styles.aqiLabelContainer}>
              <Text style={styles.aqiEmoji}>{aqiInfo.emoji}</Text>
              <Text style={[styles.aqiLabel, { color: aqiInfo.color }]}>
                {aqiInfo.label}
              </Text>
              <Text style={styles.aqiTimestamp}>
                Atualizado: {new Date(pollutionData.dt * 1000).toLocaleTimeString('pt-BR')}
              </Text>
            </View>
          </View>

          {/* AQI Bar */}
          <View style={styles.aqiBarContainer}>
            <View style={styles.aqiBarTrack}>
              <View
                style={[
                  styles.aqiBarFill,
                  {
                    width: `${(pollutionData.aqi / 5) * 100}%`,
                    backgroundColor: aqiInfo.color,
                  },
                ]}
              />
            </View>
            <View style={styles.aqiBarLabels}>
              <Text style={styles.aqiBarLabel}>Boa</Text>
              <Text style={styles.aqiBarLabel}>Moderada</Text>
              <Text style={styles.aqiBarLabel}>Ruim</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Alerta de Risco */}
      {riskAnalysis && (
        <Animated.View
          style={[
            styles.alertCard,
            {
              opacity: fadeAnim,
              borderLeftColor: riskAnalysis.color,
              backgroundColor: riskAnalysis.color + '10',
            },
          ]}
        >
          <View style={styles.alertHeader}>
            <Ionicons
              name={riskAnalysis.icon as any}
              size={24}
              color={riskAnalysis.color}
            />
            <Text style={[styles.alertTitle, { color: riskAnalysis.color }]}>
              {riskAnalysis.title}
            </Text>
          </View>
          <Text style={styles.alertMessage}>{riskAnalysis.message}</Text>
          <View style={styles.alertFooter}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} />
            <Text style={styles.alertFooterText}>Análise gerada por IA</Text>
          </View>
        </Animated.View>
      )}

      {/* Poluentes Grid */}
      {pollutionData && (
        <View>
          <Text style={styles.sectionTitle}>Níveis de Poluentes</Text>
          <View style={styles.pollutantsGrid}>
            {Object.entries(pollutionData.components).map(([key, value]) => {
              const info = POLLUTANT_INFO[key];
              if (!info) return null;
              return (
                <Animated.View
                  key={key}
                  style={[styles.pollutantCard, { opacity: fadeAnim }]}
                >
                  <Text style={styles.pollutantIcon}>{info.icon}</Text>
                  <Text style={styles.pollutantName}>{info.name}</Text>
                  <Text style={styles.pollutantValue}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </Text>
                  <Text style={styles.pollutantUnit}>{info.unit}</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="leaf" size={20} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>O que são Árvores Líquidas?</Text>
            <Text style={styles.infoDescription}>
              Biorreatores de microalgas que absorvem CO₂ e liberam O₂ com eficiência
              10 a 50 vezes maior que árvores tradicionais. Ideais para espaços urbanos
              com pouca área verde.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.base,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  locationText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // AQI Card
  aqiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aqiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aqiCardTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  aqiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  aqiBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  aqiMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  aqiNumberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: SPACING.xl,
  },
  aqiNumber: {
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  aqiScale: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textMuted,
    fontWeight: '300',
    marginBottom: 12,
  },
  aqiLabelContainer: {
    flex: 1,
  },
  aqiEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  aqiLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  aqiTimestamp: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  aqiBarContainer: {
    marginTop: SPACING.sm,
  },
  aqiBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  aqiBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aqiBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  aqiBarLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },

  // Alert Card
  alertCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  alertMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight + '30',
  },
  alertFooterText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Pollutants Grid
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  pollutantCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: (width - SPACING.base * 2 - SPACING.sm * 3) / 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  pollutantIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  pollutantName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  pollutantValue: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    fontWeight: '700',
  },
  pollutantUnit: {
    fontSize: 9,
    color: COLORS.textMuted,
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
