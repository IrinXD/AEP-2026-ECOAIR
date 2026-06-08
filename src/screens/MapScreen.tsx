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
  TextInput,
  Keyboard,
} from 'react-native';
import { Search, MapPin, X, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { MapView, Marker } from '../components/MapView';
import {
  fetchAirPollution,
  searchCityByName,
  getAqiLabel,
  AirPollutionData,
  DEFAULT_LOCATION,
  LocationData,
} from '../services/api';
import { analyzeRisk, calculateRecommendationScore, RecommendationResult } from '../utils/aiLogic';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, POLLUTANT_INFO } from '../utils/constants';

const { height } = Dimensions.get('window');

interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
  data: AirPollutionData;
}

export default function MapScreen() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const mapRef = useRef<any>(null);

  const [currentRegion, setCurrentRegion] = useState({
    latitude: DEFAULT_LOCATION.lat,
    longitude: DEFAULT_LOCATION.lon,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const results = await searchCityByName(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = async (location: LocationData) => {
    setSearchResults([]);
    setSearchQuery('');
    setLoading(true);
    
    // Animate map if supported
    if (mapRef.current && mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude: location.lat,
        longitude: location.lon,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }

    try {
      const data = await fetchAirPollution(location.lat, location.lon);
      const newPoint: MapPoint = {
        id: `${location.lat.toFixed(4)}_${location.lon.toFixed(4)}`,
        lat: location.lat,
        lon: location.lon,
        name: location.name || 'Unknown',
        data,
      };

      setPoints((prev) => [...prev.filter(p => p.id !== newPoint.id), newPoint]);
      setSelectedPoint(newPoint);
      openBottomSheet();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = useCallback(async (event: any) => {
    if (Platform.OS === 'web') return; // Handled by standard web
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLoading(true);

    try {
      const data = await fetchAirPollution(latitude, longitude);
      const newPoint: MapPoint = {
        id: `${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
        lat: latitude,
        lon: longitude,
        name: 'Selected Pin',
        data,
      };

      setPoints((prev) => [...prev, newPoint]);
      setSelectedPoint(newPoint);
      openBottomSheet();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city (e.g. Nova Déli)"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {isSearching && (
          <ActivityIndicator size="small" color={COLORS.primaryLight} style={{ marginTop: 10 }} />
        )}

        {searchResults.length > 0 && (
          <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled">
            {searchResults.map((result, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.searchResultItem}
                onPress={() => selectSearchResult(result)}
              >
                <MapPin size={16} color={COLORS.primaryLight} />
                <Text style={styles.searchResultText}>
                  {result.name}{result.state ? `, ${result.state}` : ''}, {result.country}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Map Content */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' || !MapView ? (
          <View style={styles.webFallback}>
            <MapPin size={48} color={COLORS.textMuted} />
            <Text style={styles.webFallbackText}>
              Interactive map requires the native app. Use the search bar above to fetch data.
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={currentRegion}
            onPress={handleMapPress}
            showsUserLocation
          >
            {points.map((point) => (
              <Marker
                key={point.id}
                coordinate={{ latitude: point.lat, longitude: point.lon }}
                onPress={() => {
                  setSelectedPoint(point);
                  openBottomSheet();
                }}
                pinColor={getAqiLabel(point.data.aqi).color}
              />
            ))}
          </MapView>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBadge}>
              <ActivityIndicator size="small" color={COLORS.primaryLight} />
              <Text style={styles.loadingText}>Analyzing coordinates...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      {bottomSheetVisible && selectedPoint && (
        <Modal transparent visible animationType="none">
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeBottomSheet} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.bottomSheetHandle}>
              <View style={styles.handleBar} />
            </View>

            <ScrollView style={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
              {!showRecommendation ? (
                <>
                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetTitle}>{selectedPoint.name}</Text>
                      <Text style={styles.sheetCoords}>
                        {selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)}
                      </Text>
                    </View>
                    <View style={[styles.aqiBadge, { backgroundColor: getAqiLabel(selectedPoint.data.aqi).color + '20' }]}>
                      <Text style={[styles.aqiBadgeText, { color: getAqiLabel(selectedPoint.data.aqi).color }]}>
                        AQI {selectedPoint.data.aqi}
                      </Text>
                    </View>
                  </View>

                  {(() => {
                    const risk = analyzeRisk(selectedPoint.data.aqi, selectedPoint.data.components);
                    return (
                      <View style={[styles.alertBox, { borderColor: risk.color }]}>
                        <Text style={[styles.alertTitle, { color: risk.color }]}>{risk.title}</Text>
                        <Text style={styles.alertMessage}>{risk.message}</Text>
                      </View>
                    );
                  })()}

                  <TouchableOpacity
                    style={styles.analyzeBtn}
                    onPress={() => {
                      const res = calculateRecommendationScore(
                        selectedPoint.data.aqi,
                        selectedPoint.data.components,
                        selectedPoint.lat,
                        selectedPoint.lon
                      );
                      setRecommendationResult(res);
                      setShowRecommendation(true);
                    }}
                  >
                    <Text style={styles.analyzeBtnText}>Calculate Intervention Need</Text>
                    <ArrowRight size={20} color={COLORS.background} />
                  </TouchableOpacity>
                </>
              ) : (
                recommendationResult && (
                  <View style={styles.recContainer}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setShowRecommendation(false)}>
                      <ChevronLeft size={20} color={COLORS.textSecondary} />
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.recTitle}>AI Analysis Result</Text>
                    
                    <View style={styles.scoreContainer}>
                      <Text style={[
                        styles.scoreValue,
                        { color: recommendationResult.shouldInstall ? COLORS.danger : COLORS.success }
                      ]}>
                        {recommendationResult.score}%
                      </Text>
                      <Text style={styles.scoreLabel}>Necessity Score</Text>
                    </View>

                    <Text style={styles.recDesc}>{recommendationResult.recommendation}</Text>

                    <View style={styles.factorsList}>
                      <Text style={styles.factorsTitle}>Weighted Factors</Text>
                      {recommendationResult.factors.map((f, idx) => (
                        <View key={idx} style={styles.factorRow}>
                          <Text style={styles.factorName}>{f.name}</Text>
                          <Text style={styles.factorVal}>{f.description}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.base,
  },
  searchResults: {
    maxHeight: 200,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  searchResultText: {
    color: COLORS.text,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.sm,
  },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceLight,
  },
  webFallbackText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 22,
  },
  loadingOverlay: {
    position: 'absolute',
    top: SPACING.md,
    alignSelf: 'center',
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  loadingText: { color: COLORS.text, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: height * 0.8,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  bottomSheetHandle: { alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2 },
  bottomSheetContent: { paddingHorizontal: SPACING.lg },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  sheetTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text },
  sheetCoords: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 4, fontFamily: 'monospace' },
  aqiBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm },
  aqiBadgeText: { fontWeight: '800', fontSize: FONTS.sizes.sm },
  alertBox: { borderWidth: 1, borderLeftWidth: 4, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.lg, backgroundColor: COLORS.surface },
  alertTitle: { fontWeight: '700', marginBottom: 4 },
  alertMessage: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20 },
  analyzeBtn: { backgroundColor: COLORS.primaryLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, gap: 8 },
  analyzeBtnText: { color: COLORS.background, fontWeight: '700', fontSize: FONTS.sizes.sm },
  recContainer: { paddingTop: SPACING.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  backBtnText: { color: COLORS.textSecondary, marginLeft: 4, fontWeight: '600' },
  recTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  scoreContainer: { alignItems: 'center', marginVertical: SPACING.lg },
  scoreValue: { fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  scoreLabel: { color: COLORS.textMuted, textTransform: 'uppercase', fontSize: FONTS.sizes.xs, letterSpacing: 1, marginTop: -4 },
  recDesc: { color: COLORS.text, lineHeight: 22, textAlign: 'center', marginBottom: SPACING.xl },
  factorsList: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  factorsTitle: { color: COLORS.text, fontWeight: '700', marginBottom: SPACING.md },
  factorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  factorName: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  factorVal: { color: COLORS.text, fontSize: FONTS.sizes.sm, fontWeight: '600' },
});
