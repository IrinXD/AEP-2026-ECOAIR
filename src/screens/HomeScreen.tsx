import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Wind, AlertTriangle, Info, CheckCircle2, Factory, Thermometer, CloudFog, CloudRain } from 'lucide-react-native';
import {
  fetchAirPollution,
  getAqiLabel,
  AirPollutionData,
  DEFAULT_LOCATION,
} from '../services/api';
import { calculateRecommendationScore, RecommendationResult } from '../utils/aiLogic';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, POLLUTANT_INFO } from '../utils/constants';
import { BentoCard } from '../components/BentoCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [pollutionData, setPollutionData] = useState<AirPollutionData | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAirPollution();
      setPollutionData(data);

      const recommendation = calculateRecommendationScore(
        data.aqi,
        data.components,
        DEFAULT_LOCATION.lat,
        DEFAULT_LOCATION.lon
      );
      setAiRecommendation(recommendation);
    } catch (err) {
      setError('Connection failed. Unable to fetch environmental data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.loadingText}>Analyzing biosphere data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertTriangle size={48} color={COLORS.danger} />
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
          onRefresh={loadData}
          tintColor={COLORS.primaryLight}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EcoAir Analytics</Text>
        <Text style={styles.headerSubtitle}>Live Station: {DEFAULT_LOCATION.name}</Text>
      </View>

      {pollutionData && aqiInfo && aiRecommendation && (
        <View style={styles.bentoGrid}>
          {/* Main AQI Card */}
          <BentoCard
            title="Air Quality Index"
            icon={Wind}
            iconColor={aqiInfo.color}
            value={pollutionData.aqi.toString()}
            subtitle={`Status: ${aqiInfo.label}`}
            highlightColor={aqiInfo.color}
            style={styles.fullWidthCard}
          >
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${(pollutionData.aqi / 5) * 100}%`,
                    backgroundColor: aqiInfo.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.updateTime}>
              Updated: {new Date(pollutionData.dt * 1000).toLocaleTimeString('pt-BR')}
            </Text>
          </BentoCard>

          {/* AI Recommendation Score */}
          <BentoCard
            title="Liquid Tree Priority"
            icon={Thermometer}
            iconColor={aiRecommendation.shouldInstall ? COLORS.neonOrange : COLORS.primaryLight}
            highlightColor={aiRecommendation.shouldInstall ? COLORS.neonOrange : 'transparent'}
            style={styles.fullWidthCard}
          >
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: aiRecommendation.shouldInstall ? COLORS.neonOrange : COLORS.text }]}>
                {aiRecommendation.score}%
              </Text>
              <View style={styles.scoreTextContainer}>
                <Text style={styles.scoreRecommendation}>{aiRecommendation.recommendation}</Text>
              </View>
            </View>
          </BentoCard>

          {/* Core Pollutants */}
          <View style={styles.halfWidthContainer}>
            <BentoCard
              title="PM2.5"
              icon={CloudFog}
              iconColor={COLORS.textSecondary}
              value={pollutionData.components.pm2_5.toFixed(1)}
              subtitle="µg/m³"
              style={styles.halfCard}
            />
            <BentoCard
              title="CO Level"
              icon={Factory}
              iconColor={COLORS.textSecondary}
              value={pollutionData.components.co.toFixed(0)}
              subtitle="µg/m³"
              style={styles.halfCard}
            />
          </View>
          
          <View style={styles.halfWidthContainer}>
            <BentoCard
              title="NO2"
              icon={CloudRain}
              iconColor={COLORS.textSecondary}
              value={pollutionData.components.no2.toFixed(1)}
              subtitle="µg/m³"
              style={styles.halfCard}
            />
            <BentoCard
              title="O3"
              icon={Wind}
              iconColor={COLORS.textSecondary}
              value={pollutionData.components.o3.toFixed(1)}
              subtitle="µg/m³"
              style={styles.halfCard}
            />
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
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
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: 'monospace',
  },
  errorText: {
    marginTop: SPACING.md,
    color: COLORS.danger,
    textAlign: 'center',
    fontSize: FONTS.sizes.base,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primaryLight,
    marginTop: 4,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  bentoGrid: {
    flexDirection: 'column',
    gap: SPACING.base,
  },
  fullWidthCard: {
    width: '100%',
  },
  halfWidthContainer: {
    flexDirection: 'row',
    gap: SPACING.base,
    justifyContent: 'space-between',
  },
  halfCard: {
    flex: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  updateTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    marginTop: SPACING.xs,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
  },
  scoreTextContainer: {
    flex: 1,
  },
  scoreRecommendation: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
