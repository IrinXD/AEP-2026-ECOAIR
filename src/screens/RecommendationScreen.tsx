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
  AirPollutionData,
  DEFAULT_LOCATION,
} from '../services/api';
import { calculateRecommendationScore, RecommendationResult } from '../utils/aiLogic';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function RecommendationScreen() {
  const [pollutionData, setPollutionData] = useState<AirPollutionData | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAirPollution();
      setPollutionData(data);

      const recommendation = calculateRecommendationScore(
        data.aqi,
        data.components,
        DEFAULT_LOCATION.lat,
        DEFAULT_LOCATION.lon
      );
      setResult(recommendation);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error('Erro:', err);
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
    scaleAnim.setValue(0.8);
    loadData();
  }, [loadData, fadeAnim, scaleAnim]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Processando análise de IA...</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.textMuted} />
        <Text style={styles.loadingText}>Não foi possível gerar a análise</Text>
      </View>
    );
  }

  const scoreColor = result.score > 75
    ? COLORS.danger
    : result.score > 50
    ? COLORS.warning
    : COLORS.success;

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
        <Text style={styles.headerTitle}>Painel de IA</Text>
        <Text style={styles.headerSubtitle}>Recomendação para {DEFAULT_LOCATION.name}</Text>
      </View>

      {/* Score Card */}
      <Animated.View
        style={[
          styles.scoreCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.scoreLabel}>SCORE DE NECESSIDADE</Text>

        {/* Circular Gauge */}
        <View style={styles.gaugeContainer}>
          <View style={[styles.gaugeOuter, { borderColor: scoreColor + '30' }]}>
            <View style={[styles.gaugeInner, { borderColor: scoreColor }]}>
              <Text style={[styles.gaugeScore, { color: scoreColor }]}>
                {result.score}
              </Text>
              <Text style={styles.gaugePercent}>%</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: scoreColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: scoreColor }]} />
            <Text style={[styles.statusText, { color: scoreColor }]}>
              {result.shouldInstall ? 'Instalação Recomendada' : 'Monitoramento Contínuo'}
            </Text>
          </View>
        </View>

        {/* Score Bar */}
        <View style={styles.scoreBarContainer}>
          <View style={styles.scoreBarTrack}>
            <Animated.View
              style={[
                styles.scoreBarFill,
                {
                  width: `${result.score}%`,
                  backgroundColor: scoreColor,
                },
              ]}
            />
          </View>
          <View style={styles.scoreBarLabels}>
            <Text style={styles.scoreBarLabel}>0%</Text>
            <View style={styles.scoreThreshold}>
              <View style={styles.thresholdLine} />
              <Text style={styles.scoreBarLabel}>75%</Text>
            </View>
            <Text style={styles.scoreBarLabel}>100%</Text>
          </View>
        </View>
      </Animated.View>

      {/* Recommendation */}
      <Animated.View style={[styles.recCard, { opacity: fadeAnim }]}>
        <View style={styles.recHeader}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          <Text style={styles.recTitle}>Parecer da IA</Text>
        </View>
        <Text style={styles.recText}>{result.recommendation}</Text>
      </Animated.View>

      {/* Factors */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart" size={18} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Fatores de Análise</Text>
        </View>

        {result.factors.map((factor, index) => (
          <Animated.View
            key={index}
            style={[
              styles.factorCard,
              { opacity: fadeAnim },
            ]}
          >
            <View style={styles.factorTop}>
              <View style={styles.factorLeft}>
                <Text style={styles.factorName}>{factor.name}</Text>
                <Text style={styles.factorDesc}>{factor.description}</Text>
              </View>
              <View style={styles.factorRight}>
                <Text
                  style={[
                    styles.factorValue,
                    {
                      color:
                        factor.value > 70
                          ? COLORS.danger
                          : factor.value > 40
                          ? COLORS.warning
                          : COLORS.success,
                    },
                  ]}
                >
                  {factor.value}%
                </Text>
                <Text style={styles.factorWeight}>Peso: {factor.weight}%</Text>
              </View>
            </View>
            <View style={styles.factorBarTrack}>
              <View
                style={[
                  styles.factorBarFill,
                  {
                    width: `${factor.value}%`,
                    backgroundColor:
                      factor.value > 70
                        ? COLORS.danger
                        : factor.value > 40
                        ? COLORS.warning
                        : COLORS.success,
                  },
                ]}
              />
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      {/* About Liquid Trees */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>🌿 Sobre Árvores Líquidas</Text>
        <Text style={styles.aboutText}>
          Os biorreatores de microalgas, conhecidos como "árvores líquidas", são dispositivos
          que utilizam culturas de algas para capturar CO₂ da atmosfera e converter em oxigênio
          através da fotossíntese. Um único biorreator pode equivaler a centenas de árvores
          tradicionais em termos de absorção de carbono, ocupando uma fração do espaço.
        </Text>
        <View style={styles.aboutStats}>
          <View style={styles.aboutStat}>
            <Text style={styles.aboutStatNumber}>10-50x</Text>
            <Text style={styles.aboutStatLabel}>Mais eficiente que árvores</Text>
          </View>
          <View style={styles.aboutStatDivider} />
          <View style={styles.aboutStat}>
            <Text style={styles.aboutStatNumber}>600L</Text>
            <Text style={styles.aboutStatLabel}>Capacidade típica</Text>
          </View>
          <View style={styles.aboutStatDivider} />
          <View style={styles.aboutStat}>
            <Text style={styles.aboutStatNumber}>1 ton</Text>
            <Text style={styles.aboutStatLabel}>CO₂/ano absorvido</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
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

  // Header
  header: {
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Score Card
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  gaugeOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  gaugeScore: {
    fontSize: 48,
    fontWeight: '900',
  },
  gaugePercent: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textMuted,
    fontWeight: '300',
    marginTop: -8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    gap: 8,
    marginTop: SPACING.base,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  scoreBarContainer: {
    marginTop: SPACING.sm,
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreBarLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  scoreThreshold: {
    alignItems: 'center',
  },
  thresholdLine: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.textMuted,
    marginBottom: 2,
  },

  // Recommendation Card
  recCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  recTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Factor Card
  factorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  factorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  factorLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  factorRight: {
    alignItems: 'flex-end',
  },
  factorName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  factorDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  factorValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  factorWeight: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  factorBarTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // About Card
  aboutCard: {
    backgroundColor: COLORS.primary + '08',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.primary + '15',
  },
  aboutTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  aboutText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.base,
  },
  aboutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  aboutStat: {
    alignItems: 'center',
    flex: 1,
  },
  aboutStatNumber: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.primary,
  },
  aboutStatLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  aboutStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.primary + '20',
  },
});
