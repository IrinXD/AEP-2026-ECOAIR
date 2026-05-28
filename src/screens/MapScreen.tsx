import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchAirPollution,
  getAqiLabel,
  AirPollutionData,
  DEFAULT_LOCATION,
} from '../services/api';
import { analyzeRisk, calculateRecommendationScore, RecommendationResult } from '../utils/aiLogic';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, POLLUTANT_INFO } from '../utils/constants';

const { width, height } = Dimensions.get('window');

interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  data: AirPollutionData;
}

export default function MapScreen() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = {
    latitude: DEFAULT_LOCATION.lat,
    longitude: DEFAULT_LOCATION.lon,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const handleMapPress = useCallback(async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLoading(true);

    try {
      const data = await fetchAirPollution(latitude, longitude);
      const newPoint: MapPoint = {
        id: `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${Date.now()}`,
        lat: latitude,
        lon: longitude,
        data,
      };

      setPoints((prev) => [...prev, newPoint]);
      setSelectedPoint(newPoint);
      openBottomSheet();
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkerPress = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
    setShowRecommendation(false);
    setRecommendationResult(null);
    openBottomSheet();
  }, []);

  const openBottomSheet = () => {
    setBottomSheetVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 9,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setBottomSheetVisible(false);
      setShowRecommendation(false);
      setRecommendationResult(null);
    });
  };

  const handleAnalyzeViability = () => {
    if (!selectedPoint) return;

    const result = calculateRecommendationScore(
      selectedPoint.data.aqi,
      selectedPoint.data.components,
      selectedPoint.lat,
      selectedPoint.lon
    );
    setRecommendationResult(result);
    setShowRecommendation(true);
  };

  const getMarkerColor = (aqi: number): string => {
    const info = getAqiLabel(aqi);
    return info.color;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mapa Estratégico</Text>
        <Text style={styles.headerSubtitle}>Toque no mapa para analisar um ponto</Text>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton
          mapType="standard"
        >
          {/* Default Marker for Marialva */}
          <Marker
            coordinate={{
              latitude: DEFAULT_LOCATION.lat,
              longitude: DEFAULT_LOCATION.lon,
            }}
            title="Marialva, PR"
            description="Localização padrão"
            pinColor={COLORS.primary}
          />

          {/* Dynamic Markers */}
          {points.map((point) => (
            <Marker
              key={point.id}
              coordinate={{
                latitude: point.lat,
                longitude: point.lon,
              }}
              onPress={() => handleMarkerPress(point)}
              pinColor={getMarkerColor(point.data.aqi)}
            />
          ))}
        </MapView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingPill}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Analisando ponto...</Text>
            </View>
          </View>
        )}

        {/* Points Counter */}
        <View style={styles.counterBadge}>
          <Ionicons name="pin" size={14} color={COLORS.primary} />
          <Text style={styles.counterText}>{points.length} pontos</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      {bottomSheetVisible && selectedPoint && (
        <Modal transparent visible animationType="none">
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeBottomSheet}
          />
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Handle */}
            <View style={styles.bottomSheetHandle}>
              <View style={styles.handleBar} />
            </View>

            <ScrollView style={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
              {!showRecommendation ? (
                /* Dados de Poluição */
                <>
                  {/* AQI Header */}
                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetTitle}>Dados de Poluição</Text>
                      <Text style={styles.sheetCoords}>
                        📍 {selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.sheetAqiBadge,
                        { backgroundColor: getAqiLabel(selectedPoint.data.aqi).color },
                      ]}
                    >
                      <Text style={styles.sheetAqiText}>
                        AQI {selectedPoint.data.aqi}
                      </Text>
                      <Text style={styles.sheetAqiLabel}>
                        {getAqiLabel(selectedPoint.data.aqi).label}
                      </Text>
                    </View>
                  </View>

                  {/* Alert */}
                  {(() => {
                    const risk = analyzeRisk(selectedPoint.data.aqi, selectedPoint.data.components);
                    return (
                      <View style={[styles.sheetAlert, { borderLeftColor: risk.color, backgroundColor: risk.color + '10' }]}>
                        <Text style={[styles.sheetAlertTitle, { color: risk.color }]}>{risk.title}</Text>
                        <Text style={styles.sheetAlertMsg}>{risk.message}</Text>
                      </View>
                    );
                  })()}

                  {/* Pollutants */}
                  <View style={styles.sheetPollutants}>
                    {Object.entries(selectedPoint.data.components).map(([key, val]) => {
                      const info = POLLUTANT_INFO[key];
                      if (!info) return null;
                      return (
                        <View key={key} style={styles.sheetPollutantRow}>
                          <Text style={styles.sheetPollutantIcon}>{info.icon}</Text>
                          <Text style={styles.sheetPollutantName}>{info.name}</Text>
                          <Text style={styles.sheetPollutantValue}>
                            {typeof val === 'number' ? val.toFixed(2) : val} {info.unit}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Analyze Button */}
                  <TouchableOpacity
                    style={styles.analyzeButton}
                    onPress={handleAnalyzeViability}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="analytics" size={20} color="#fff" />
                    <Text style={styles.analyzeButtonText}>
                      🌿 Analisar Viabilidade para Árvore Líquida
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Recommendation Panel */
                recommendationResult && (
                  <>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setShowRecommendation(false)}
                    >
                      <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                      <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>

                    <Text style={styles.recTitle}>Score de Necessidade</Text>

                    {/* Score Gauge */}
                    <View style={styles.gaugeContainer}>
                      <View style={[
                        styles.gaugeCircle,
                        {
                          borderColor: recommendationResult.score > 75
                            ? COLORS.danger
                            : recommendationResult.score > 50
                            ? COLORS.warning
                            : COLORS.success,
                        },
                      ]}>
                        <Text style={[
                          styles.gaugeScore,
                          {
                            color: recommendationResult.score > 75
                              ? COLORS.danger
                              : recommendationResult.score > 50
                              ? COLORS.warning
                              : COLORS.success,
                          },
                        ]}>
                          {recommendationResult.score}%
                        </Text>
                        <Text style={styles.gaugeLabel}>
                          {recommendationResult.shouldInstall ? 'INSTALAR' : 'MONITORAR'}
                        </Text>
                      </View>
                    </View>

                    {/* Recommendation Text */}
                    <View style={styles.recTextBox}>
                      <Text style={styles.recText}>{recommendationResult.recommendation}</Text>
                    </View>

                    {/* Factors */}
                    <Text style={styles.factorsTitle}>Fatores de Decisão</Text>
                    {recommendationResult.factors.map((factor, index) => (
                      <View key={index} style={styles.factorCard}>
                        <View style={styles.factorHeader}>
                          <Text style={styles.factorName}>{factor.name}</Text>
                          <Text style={styles.factorWeight}>Peso: {factor.weight}%</Text>
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
                        <Text style={styles.factorDesc}>{factor.description}</Text>
                      </View>
                    ))}
                  </>
                )
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: SPACING.base,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface + 'EE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  counterBadge: {
    position: 'absolute',
    bottom: SPACING.base,
    right: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface + 'EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  counterText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },

  // Bottom Sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.75,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
  },
  bottomSheetContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Sheet Content
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
  },
  sheetTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetCoords: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  sheetAqiBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  sheetAqiText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  sheetAqiLabel: {
    color: '#fff',
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
    opacity: 0.9,
  },
  sheetAlert: {
    borderLeftWidth: 3,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  sheetAlertTitle: {
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
    marginBottom: 4,
  },
  sheetAlertMsg: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sheetPollutants: {
    marginBottom: SPACING.base,
  },
  sheetPollutantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sheetPollutantIcon: {
    fontSize: 16,
    width: 28,
  },
  sheetPollutantName: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sheetPollutantValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '700',
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.base,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },

  // Recommendation
  recTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  gaugeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  gaugeScore: {
    fontSize: 36,
    fontWeight: '800',
  },
  gaugeLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  recTextBox: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
  },
  recText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  factorsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  factorCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  factorName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '600',
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
    marginBottom: 6,
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  factorDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
